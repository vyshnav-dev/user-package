import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { securityApis } from "./Infrastructure/security/security";
import UserSummary from "./UserSummary";
import UserDetails from "./UserDetails";

export default function UserContainer() {

  const location = useLocation();
  const [page, setPage] = useState(1);
  const [id, setId] = useState(0);
  const [menuIdLocal, setmenuIdLocal] = useState(null);
  const [userAction, setuserAction] = useState([]);
  const menuId = location?.state;
  const navigate = useNavigate();
  const { getuseractionsforscreen } = securityApis()

  useEffect(() => {
    if (menuId?.Screen) setmenuIdLocal(menuId?.Screen);
    else if (menuId?.Screen == undefined && menuIdLocal == null) {
       navigate("/home",{ state: { Screen: 1 } });
    }
    setPage(1)
  }, [menuId?.Screen]);

 
 


  useEffect(() => {
    const fetchUserActions = async () => {
      try {
        const response = await getuseractionsforscreen({ Screen: menuIdLocal });
        const data = JSON.parse(response?.result);
        setuserAction(data);
      } catch (error) {
        navigate("/home",{ state: { Screen: 1 } });
      }
    };
    if (menuIdLocal) fetchUserActions();
  }, [menuIdLocal]);
  
  return (
    <>

      {page === 1 ? (
        <UserSummary
          setPageRender={setPage}
          setId={setId}
          Id={id}
          userAction={userAction}
          screenId={menuId}
        />
      ) : page === 2 ? (
        <UserDetails
          setPageRender={setPage}
          detailPageId={id}
          userAction={userAction}
        />
      ) : null}
    </>
  );
}
