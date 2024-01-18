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
  const userData =  userDocSnapshot.data();
  const userType = userData.type;
  if (userType === userTypes.official) {
    return true;
  } else {
    return false;
  }
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
    await addDoc(collection(db, "complaints"), updatedFormData);

    // Envia o corpo do email para o serviço local
    await axios.post('http://localhost:3000/send', {
      to: selectedEmails.join(','), // Concatena os emails selecionados em uma string
      subject: 'Assunto do Email',
      html: `
        <h2>Criar um registro</h2>
        <p><strong>Localização:</strong> ${formData.location.name}</p>
        <p><strong>Assunto:</strong> ${formData.reason}</p>
        <p><strong>Mais informação:</strong> ${formData.additionalInfo}</p>
        <p><strong>Destinatários Selecionados:</strong> ${selectedEmails.join(',')}</p>
        <p><strong>Termos Aceitos:</strong> ${formData.termsAccepted ? 'Sim' : 'Não'}</p>
      `,
    });

    await axios.post('http://localhost:3000/send', {
      to: auth.currentUser.email,
      subject: 'Aqui está seu Protocolo',
      html: `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
      
        <style>
          
          div{
            border: 1px solid rgba(0, 0, 0, 0.527);
            border-radius: 25px;
            box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.418);
      
            height: 250px;
            width: 50%;
            margin: auto;
            background-image: linear-gradient(to bottom, #b8d3e2 0%, #87c2e5 53% 10%)
          }
      
          h1 {
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
          }
      
          p {
            text-align: center;
            font-size: 2.5em;
            font-family: Arial, Helvetica, sans-serif;
            margin-top: 10px;
            color: white;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>Aqui está seu número de protocolo</h1>
          <p>${protocolNumber}</p>
        </div>
        
      </body>
      </html>
      `,
    });

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

export const fetchComplaints = (handleComplaintsUpdate) => {
  const complaintsCollection = collection(db, "complaints");

  return onSnapshot(complaintsCollection, async (complaintsSnapshot) => {
    const updatedComplaints = [];

    for (const complaintDoc of complaintsSnapshot.docs) {
      const complaintData = complaintDoc.data();
      const complaintId = complaintDoc.id;
      const reportedByUserId = complaintData.reportedBy;

      const userDoc = await getDoc(doc(db, "users", reportedByUserId));
      const userData = userDoc.data();

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