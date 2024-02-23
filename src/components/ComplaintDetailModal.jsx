import React, { useEffect, useState } from "react";
import { Dialog } from "@mui/material";
import {
  faClockFour,
  faClose,
  faMapMarkerAlt,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Send, WindowSharp } from "@mui/icons-material";
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Select,
  MenuItem,
} from "@mui/material";
import { auth } from "../utils/Firebase";
import {
  addComment,
  isOfficial,
  markAsRejected,
  markAsSolved,
  addSelectedEmail,
} from "../utils/FirebaseFunctions";
import { Statuses, statusColors } from "../utils/enums";
import CommentsTile from "./CommentsTile";

const ComplaintDetailModal = ({ setDialogOpen, complaint }) => {
  const [Official, setOfficial] = useState(false);
  const [CommentBoxDisabled, setCommentBoxDisabled] = useState(true);
  const [newEmailValue, setNewEmailValue] = useState("");
  const [CommentFValue, setCommentFValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("");

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user && isOfficial(user.uid)) {
        setOfficial(true);
      }
    });
  }, []);

  let TimeStamp = new Date(complaint.timestamp);
  let date = TimeStamp.toLocaleDateString();
  let time = TimeStamp.toLocaleTimeString("pt-BR", {
    hour: "numeric",
    minute: "numeric",
  });
  let StatusColorEnum = Object.keys(Statuses).find(
    (key) => Statuses[key] === complaint.status
  );

  return (
    <div className="">
      <DialogTitle className="flex justify-between">
        {complaint.reason === "Elogio" ? (
          `Detalhes do ${complaint.reason}`
        ) : complaint.reason === "Outros" ? (
          "Detalhes"
        ) : (
          `Detalhes da ${complaint.reason}`
        )}
        <DialogActions>
          <FontAwesomeIcon
            onClick={() => {
              setDialogOpen((prevState) => !prevState);
            }}
            className="cursor-pointer"
            icon={faClose}
          />
        </DialogActions>
      </DialogTitle>
      <DialogContent>
        <div className="">
        <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <p>{complaint.location.name || "Não Informado"}</p>
        </div>
        <span
          className="w-30 text-center rounded-xl font-bold flex items-center text-white h-12 lg:h-12 px-4"
          style={{
            backgroundColor: statusColors[StatusColorEnum],
          }}
        >
          {complaint.status}
        </span>
      </div>

          <div className="flex gap-3 items-center">
            <FontAwesomeIcon icon={faClockFour} />
            <p>{date + " , " + time}</p>
          </div>
          <h2 className="text-lg font-bold my-4">{complaint.reason}</h2>
          <p>{complaint.additionalInfo}</p>

          <div className="flex mt-8 gap-3 items-center">
            <FontAwesomeIcon icon={faHashtag} />
            <p>Número de Protocolo: {complaint.protocolNumber}</p>
          </div>

          {complaint.mediaType === "image" ? (
            <img
              className="max-w-full w-auto h-96 object-scale-down"
              src={complaint.mediaPath}
              alt="Imagem da reclamação"
            />
          ) : complaint.mediaType === "video" ? (
            <video
              controls
              className="max-w-full w-auto h-96 object-scale-down"
              src={complaint.mediaPath}
              alt="Vídeo da reclamação"
            />
          ) : null}
          <h2 className="text-lg font-bold my-4">Comentários</h2>
          <div>
            {complaint.comments && complaint.comments.length === 0 ? (
              <p className="text-center">Sem comentários</p>
            ) : (
              complaint.comments.map((comment) => (
                <CommentsTile key={comment.id} comment={comment} />
              ))
            )}
          </div>
          <div>
            <hr className={`mt-8 flex items-center flex-col`} >
          </hr>
          </div>
          <div
            className={`${
              complaint.status !== Statuses.inProgress ? "hidden" : "block"
            } my-4 flex  items-center flex-col`}
          >
            <div className="max-w-[600px] w-full flex gap-4 mt-4">
              <TextField
                fullWidth
                value={CommentFValue}
                onChange={(e) => {
                  setCommentFValue(e.target.value);
                  if (e.target.value === "") {
                    setCommentBoxDisabled(true);
                  } else {
                    setCommentBoxDisabled(false);
                  }
                }}
                variant="outlined"
                label="Comente"
              />
              <div className="flex gap-4">
                <IconButton
                  className="h-10 w-10 shadow-xl border rounded-full flex items-center justify-center"
                  onClick={() => {
                    addComment(complaint.id, CommentFValue);
                    setCommentFValue("");
                  }}
                  disabled={CommentBoxDisabled}
                >
                  <Send />
                </IconButton>
              </div>
            </div>
            <div className="max-w-[500px] w-full flex gap-4 mt-8">
                <h1>Houve um engano quanto à responsabilidade por esta solicitação? Encaminhe para o e-mail do responsável</h1>
            </div>
            <div className="max-w-[600px] w-full flex gap-4 mt-2">
                <Select
                  fullWidth
                  value={newEmailValue}
                  onChange={(e) => setNewEmailValue(e.target.value)}
                  variant="outlined"
                  label="Selecione a opção"
                >
                  <MenuItem value="opcao1">Opção 1</MenuItem>
                  <MenuItem value="opcao2">Opção 2</MenuItem>
                  <MenuItem value="opcao3">Opção 3</MenuItem>
                  <MenuItem value="opcao1">Opção 1</MenuItem>
                  <MenuItem value="opcao2">Opção 2</MenuItem>
                  <MenuItem value="opcao3">Opção 3</MenuItem>
                </Select>
                <IconButton
                  className="h-10 w-10 shadow-xl border rounded-full flex items-center justify-center"
                  onClick={() => {
                    addSelectedEmail(complaint.id, newEmailValue);
                    setNewEmailValue("");  // Limpa o campo de novo email
                    alert('Encaminhado com sucesso')
                  }}
                  disabled={!newEmailValue}
                >
                  <Send />
                </IconButton>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions>
        {Official && complaint.status === Statuses.inProgress ? (
          <>
            <Button
              color="error"
              variant="outlined"
              onClick={async () => {
                await markAsRejected(complaint.id);
                setDialogOpen(false);
              }}
            >
              Marcar como Não Resolvido
            </Button>
            <Button
              onClick={async () => {
                await markAsSolved(complaint.id);
                setDialogOpen(false);
              }}
              color="success"
              variant="contained"
            >
              Marcar como Resolvido
            </Button>
          </>
        ) : null}
      </DialogActions>
    </div>
  );
};

export default ComplaintDetailModal;
