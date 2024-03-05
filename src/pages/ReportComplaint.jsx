import styled from "@emotion/styled";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { LocationSearching } from "@mui/icons-material";
import {
  Box,
  Button,
  ButtonBase,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup
} from "@mui/material";
import MuiTextField from "@mui/material/TextField";
import React, { useEffect, useRef, useState } from "react";
import CreatableSelect from 'react-select/creatable';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import DashboardLinkButton from "../components/DashboardLinkButton";
import Navbar from "../components/Navbar";
import SpinnerModal from "../components/SpinnerModal";
import { auth } from "../utils/Firebase";
import { createComplaint, isOfficial } from "../utils/FirebaseFunctions";
import { identifyLocation } from "../utils/MiscFunctions";
import { Statuses } from "../utils/enums";

const TextField = styled(MuiTextField)((props) => ({
  width: "91%",
  [`& fieldset`]: {
    borderRadius: "15px",
  },
}));

const ReportComplaint = () => {
  const [Media, setMedia] = useState();
  const [MediaPath, setMediaPath] = useState("");
  const [FormData, setFormData] = useState({
    location: {
      name: "",
      lat: "",
      lng: "",
    },
    mediaPath: "",
    reason: "",
    additionalInfo: "",
    reportedBy: "",
    timestamp: "",
    status: Statuses.inProgress,
    mediaType: "",
    selectedEmails: [],  // Adicionado estado para armazenar os emails selecionados
  });
  const [LoaderVisibile, setLoaderVisibile] = useState(false);
  const FileInput = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (!user || !isOfficial(user.uid)) {
        return navigate("/");
      }
      setFormData({ ...FormData, reportedBy: user.uid });
    });
  }, []);

  return (
    <div className="overflow-x-hidden">
      <SpinnerModal visible={LoaderVisibile} />
      <Navbar />
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <h2 className=" lg:mt-10 leading-normal font-bold text-center text-xl lg:text-[2rem] my-6 lg:text-left lg:mx-20">
        Criar um registro
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoaderVisibile(true);
          createComplaint(FormData, Media, FormData.selectedEmails)
            .then(() => {
              toast.success("Registro criado com sucesso!");
              setTimeout(() => {
                navigate("/citizen-dashboard");
              }, 3000);
            })
            .finally(() => {
              setLoaderVisibile(false);
            })
            .catch((err) => {
              toast.error(err.message);
            });
        }}
      >
        <input
          type="file"
          ref={FileInput}
          className="opacity-0"
          accept="image/*, video/*"
          onChange={(e) => {
            setMedia(e.target.files[0]);
            setFormData({
              ...FormData,
              mediaType: e.target.files[0].type.split("/")[0],
            });
            setMediaPath(URL.createObjectURL(e.target.files[0]));
          }}
          name=""
          id=""
        />
        <DashboardLinkButton
          className={`${Media ? "hidden" : "block"} mx-[8vw]` }
          icon={faCamera}
          name={"Envie uma foto/vídeo sobre o assunto"}
          onClick={() => FileInput.current.click()}
          subtitle={"Confirme que tudo está claro"}
        />
        <div
          className={`flex flex-col justify-center items-center mx-8 lg:mx-20 py-6 ${
            Media ? "block" : "hidden"
          }`}
        >
          <img
            src={Media && FormData.mediaType === "image" ? MediaPath : null}
            alt=""
            className={`max-w-full w-auto my-6 h-96 object-scale-down
          ${Media && FormData.mediaType == "image" ? "block" : "hidden"}
          `}
          />
          <video
            controls
            src={Media && FormData.mediaType === "video" ? MediaPath : null}
            className={`max-w-full w-auto my-6 h-96 object-scale-down
          ${Media && FormData.mediaType == "video" ? "block" : "hidden"}
          `}
          ></video>
          <Button
            onClick={() => FileInput.current.click()}
            hidden={Media ? false : true}
            variant="outlined"
          >
            Mudar imagem
          </Button>
        </div>
        <Box ml={'8vw'}>
          <TextField
            variant="outlined"
            label="Localização"
            value={FormData.location.name}
            contentEditable={false}
            InputProps={{
              endAdornment: (
                <ButtonBase
                  onClick={async () => {
                    let locationRes = await identifyLocation();
                    setFormData({ ...FormData, location: locationRes });
                  }}
                >
                  <LocationSearching />
                </ButtonBase>
              ),
            }}
          />
          <p className="mt-6">Assunto:</p>
          <RadioGroup
            onChange={(e) => {
              setFormData({ ...FormData, reason: e.target.value });
            }}
            value={FormData.reason}
          >
            <FormControlLabel
              value="Reclamação"
              control={<Radio required/>}
              label="Reclamação"
            />
            <FormControlLabel
              value="Elogio"
              control={<Radio required/>}
              label="Elogio"
            />
            <FormControlLabel
              value="Dúvida"
              control={<Radio required/>}
              label="Dúvida"
            />
            <FormControlLabel
              value="Solicitação"
              control={<Radio required/>}
              label="Solicitação"
            />
            <FormControlLabel
              value="Crítica"
              control={<Radio required/>}
              label="Crítica"
            />
            <FormControlLabel
              value="Sugestão"
              control={<Radio required/>}
              label="Sugestão"
            />
            <FormControlLabel
              value="Outros"
              control={<Radio required/>}
              label="Outros"
              style={{ marginBottom: '20px' }}
            />
          </RadioGroup>
          <p className="my-2">Mais informação</p>
          <TextField
            required
            multiline
            style={{ marginBottom: '20px' }}
            value={FormData.additionalInfo}
            onChange={(e) => {
              setFormData({ ...FormData, additionalInfo: e.target.value });
            }}
            rows={3}
            placeholder="Forneça mais informação sobre o registro"
          />
          <p className="my-2">Selecionar destinatários:</p>
          <CreatableSelect
            isMulti
            onChange={(selectedOptions) => {
              const emails = selectedOptions.map((option) => option.value);
              setFormData({ ...FormData, selectedEmails: emails });
            }}
            options={[
              { value: 'gustavolennyng@outlook.com', label: 'Prefeitura' }
            ]}
            styles={{
              container: (provided, state) => ({
                ...provided,
                marginBottom: '16px',
                maxWidth: '91%'
              }),
              control: (provided, state) => ({
                ...provided,
                background: 'transparent',
                border: '1px solid #aaa',
                borderRadius: '10px',
                fontSize: '15px',
                boxShadow: 'none',
                marginBottom: '20px'
              }),
              option: (provided, state) => ({
                ...provided,
                background: 'transparent',
                color: 'black',
              }),
            }}
            placeholder="Selecione uma entidade responsável pela sua solicitação"
          />
          <FormControlLabel
            required
            value="terms-accepted"
            control={<Checkbox />}
            label="Marcando esta caixa, Eu compreendo que fazer denúncias falsas resultarão em responsabilização criminal."
            style={{ marginBottom: '20px' }}
          />
        </Box>
        <div className="flex justify-center my-8 px-40 lg:px-96">
          <Button variant="contained" fullWidth type="submit">
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportComplaint;
