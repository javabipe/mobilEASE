import React, { useState } from "react";
import { Dialog } from "@mui/material";
import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Statuses, statusColors } from "../utils/enums";
import ComplaintDetailModal from "./ComplaintDetailModal";

const ComplaintsCard = ({ complaint }) => {
  const [DialogOpen, setDialogOpen] = useState(false);
  let date = new Date(complaint.timestamp);
  let StatusColorEnum = Object.keys(Statuses).find(
    (key) => Statuses[key] === complaint.status
  );

  return (
    <>
      <Dialog
        open={DialogOpen}
        children={
          <ComplaintDetailModal
            setDialogOpen={setDialogOpen}
            complaint={complaint}
          />
        }
      />
      <div
        className="border shadow-[2px_4px_11px_1px_rgba(0,0,0,0.25)] border-solid border-[rgba(45,41,41,0.4)] rounded-lg my-4 p-4 flex flex-col gap-2 "
        onClick={() => {
          setDialogOpen(true);
        }}
        style={{ fontSize: "14px" }} 
      >
        {/* Conteúdo do box */}
        <div className="flex justify-between">
          <div>
            <p>Data de criação: {date.toLocaleDateString("en-IN")}</p>
          </div>
          <p className="font-bold">{complaint.reason}</p>
        </div>
        <div className="flex items-center">
          <FontAwesomeIcon size="1x" icon={faMapMarkerAlt} />
          <p className="ml-2">{complaint.location.name}</p>
        </div>
        <div className="flex justify-between">
          <span className="flex gap-3 font-bold">
            Status:{" "}
            <p
              style={{
                color: statusColors[StatusColorEnum],
              }}
            >
              {complaint.status}
            </p>
          </span>
        </div>
      </div>
    </>
  );
};

export default ComplaintsCard;
