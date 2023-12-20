import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterAccount from "../components/RegisterAccount";
import { auth } from "../utils/Firebase";
import { isOfficial } from "../utils/FirebaseFunctions";
import TrafficArt from "/src/assets/traffic-art.png";
import Navbar from "/src/components/Navbar";
const HomePage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      if (user && !isOfficial(user.uid)) {
        navigate("/citizen-dashboard");
      } else if (user && isOfficial(user.uid)) {
        navigate("/official-dashboard");
      }
    });
  }, []);
  return (
    <div className="HomePage">
      <Navbar />
      <div className="HomeContainer grid grid-cols-1 lg:grid-cols-2 items-center px-5 lg:px-20">
        <img
          className="TrafficArt hidden lg:block "
          src={TrafficArt}
          alt=""
        />
        <div>
          <h3 className="slogan  lg:mt-0 leading-normal font-bold text-center text-base lg:text-[2rem]">
            ESTAMOS AQUI PARA TE OUVIR
          </h3>
          <RegisterAccount />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
