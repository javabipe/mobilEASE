import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db, storage } from "./Firebase";
import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  setDoc,
  doc,
  where,
  arrayUnion,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Statuses, userTypes } from "./enums";
import axios from 'axios';


export const handleRegistration = async (formData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const user = userCredential.user;
    await updateProfile(user, { displayName: formData.name });
    await setDoc(doc(db, "users", user.uid), {
      name: formData.name,
      email: formData.email,
      mobile: formData.mobile,
      type: userTypes.citizen,
    });
    return user;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const isOfficial = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const userDocSnapshot = await getDoc(userDocRef);

  if (userDocSnapshot.exists()) { // Verifique se o documento existe
    const userData = userDocSnapshot.data();

    if (userData && userData.type === userTypes.official) {
      return true;
    }
  }

  return false;
};

export const handleLogin = async (formData) => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const user = userCredential.user;
    const isOfficialUser = await isOfficial(user.uid);
    return { ...user, official: isOfficialUser };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createComplaint = async (formData, media, selectedEmails) => {
  const timestamp = Date.now();

  try {
    let fileLink = null;

    if (media) {
      const fileName = `complaints/${timestamp}.${media.name.split(".")[1]}`;
      const fileRef = ref(storage, fileName);
      await uploadBytes(fileRef, media);
      fileLink = await getDownloadURL(fileRef);
    }

    // Gera um protocolo com 7 dígitos
    const protocolNumber = Math.floor(1000000 + Math.random() * 9000000);

    // Adiciona o protocolo
    const updatedFormData = {
      ...formData,
      timestamp,
      mediaPath: fileLink,
      protocolNumber,
      selectedEmails: selectedEmails || [],
    };

    // Adiciona os dados ao Firestore
    const docRef = await addDoc(collection(db, "complaints"), updatedFormData);

    // Envie e-mails usando o SendGrid 
    const sendGridApiKey = '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';
    const apiUrl = 'https://api.sendgrid.com/v3/mail/send';

    const emailPayload = {
      personalizations: [
        {
          to: selectedEmails.map(email => ({ email })),
          subject: 'Novo registro no FalaGov',
        },
      ],
      from: {
        email: 'falecomogoverno@gmail.com',
      },
      content: [
        {
          type: 'text/html',
          value: `
            <h2>Informações do registro</h2>
            <p><strong>Localização:</strong> ${formData.location.name}</p>
            <p><strong>Assunto:</strong> ${formData.reason}</p>
            <p><strong>Detalhes:</strong> ${formData.additionalInfo}</p>
            ${fileLink ? `<img src="${fileLink}" alt="Anexo de mídia" style="max-width: 100%;" />` : ''}
          `,
        },
      ],
    };

    await axios.post(apiUrl, emailPayload, {
      headers: {
        Authorization: `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Envie o segundo e-mail para o usuário que criou a reclamação
    const userEmailAddress = auth.currentUser.email;

    const segundoEmailPayload = {
      personalizations: [
        {
          to: [{ email: userEmailAddress }],
          subject: 'Aqui está seu Protocolo',
        },
      ],
      from: {
        email: 'falecomogoverno@gmail.com',
      },
      content: [
        {
          type: 'text/html',
          value: `
            <h2>Seu registro foi criado com sucesso!</h2>
            <h2>Em breve, um de nossos responsáveis irá analisar sua situação.</h2>
            <h2>Aqui está seu número de protocolo: ${protocolNumber}</h2>
            <h2>Estamos ansiosos para fornecer o melhor atendimento possível.</h2>
          `,
        },
      ],
    };

    await axios.post(apiUrl, segundoEmailPayload, {
      headers: {
        Authorization: `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Continuar com a lógica para outras operações necessárias.

  } catch (error) {
    throw new Error(error.message);
  }
};


export const fetchComplaintsByUser = (uid, handleComplaintsUpdate) => {
  const complaintsRef = collection(db, "complaints");
  const q = query(complaintsRef, where("reportedBy", "==", uid));

  return onSnapshot(q, async (querySnapshot) => {
    const complaints = [];

    for (const complaintDoc of querySnapshot.docs) {
      const complaintData = complaintDoc.data();
      const complaintId = complaintDoc.id;

      const commentsRef = collection(db, "complaints", complaintId, "comments");
      const commentsQuerySnapshot = await getDocs(commentsRef);
      const comments = commentsQuerySnapshot.docs.map((commentDoc) => ({
        id: commentDoc.id,
        ...commentDoc.data(),
      }));

      const complaintWithComments = {
        id: complaintId,
        ...complaintData,
        comments: comments,
      };

      complaints.push(complaintWithComments);
    }

    handleComplaintsUpdate(complaints);
  });
};

export const findComplaintAuthor = async (uid) => {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("reportedBy", "==", uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.data();
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

export const fetchComplaints = (handleComplaintsUpdate, officialEmail) => {

  const complaintsCollection = collection(db, "complaints");

  return onSnapshot(complaintsCollection, async (complaintsSnapshot) => {
    const updatedComplaints = [];

    for (const complaintDoc of complaintsSnapshot.docs) {
      const complaintData = complaintDoc.data();
      const complaintId = complaintDoc.id;
      const reportedByUserId = complaintData.reportedBy;

      const userDoc = await getDoc(doc(db, "users", reportedByUserId));
      const userData = userDoc.data();

      // Verifique se o email do oficial está presente na lista selectedEmails
      if (complaintData.selectedEmails && officialEmail && complaintData.selectedEmails.includes(officialEmail)) {
        const complaintWithAuthor = {
          id: complaintId,
          author: userData.name,
          ...complaintData,
          comments: [],
        };

        const commentsCollection = collection(
          db,
          "complaints",
          complaintId,
          "comments"
        );
        const commentsUnsubscribe = onSnapshot(
          commentsCollection,
          (commentsSnapshot) => {
            const comments = commentsSnapshot.docs.map((commentDoc) => {
              const commentData = commentDoc.data();
              const commentId = commentDoc.id;

              return {
                id: commentId,
                author: commentData.author,
                comment: commentData.comment,
                timestamp: commentData.timestamp,
              };
            });

            complaintWithAuthor.comments = comments;
            handleComplaintsUpdate([...updatedComplaints]);
          }
        );

        updatedComplaints.push(complaintWithAuthor);
        complaintWithAuthor.commentsUnsubscribe = commentsUnsubscribe;
      }
    }

    handleComplaintsUpdate([...updatedComplaints]);
  });
};


export const addComment = async (complaintID, comment) => {
  try {
    const user = auth.currentUser;
    const commentsCollection = collection(
      db,
      "complaints",
      complaintID,
      "comments"
    );
    const newComment = {
      author: user.uid,
      comment: comment,
      timestamp: Date.now(),
    };

    await addDoc(commentsCollection, newComment);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const addSelectedEmail = async (complaintID, newEmail) => {
  try {
    const complaintDocRef = doc(db, "complaints", complaintID);
    const complaintDocSnapshot = await getDoc(complaintDocRef);

    if (complaintDocSnapshot.exists()) {
      const complaintData = complaintDocSnapshot.data();
      
      // Verifica se o campo selectedEmails já existe
      const selectedEmails = complaintData.selectedEmails || [];

      // Adiciona o novo email ao array
      selectedEmails.push(newEmail);

      // Atualiza o documento no Firestore
      await updateDoc(complaintDocRef, { selectedEmails });
    } else {
      throw new Error("Complaint document does not exist");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};


export const fetchUserById = async (uid) => {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDocSnapshot = await getDoc(userDocRef);
    return userDocSnapshot.data();
  } catch (error) {
    console.error("Error fetching complaints:", error);
    throw error;
  }
};

export const markAsSolved = async (complaintID) => {
  try {
    const complaint = doc(db, "complaints", complaintID);

    await updateDoc(complaint, { status: Statuses.solved });
  } catch (error) {
    throw new Error(error.message);
  }
};
export const markAsRejected = async (complaintID) => {
  try {
    const complaint = doc(db, "complaints", complaintID);

    await updateDoc(complaint, { status: Statuses.rejected });
  } catch (error) {
    throw new Error(error.message);
  }
};