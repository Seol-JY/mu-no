import styled from "styled-components";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Container } from "../../components";
import { userStore, socketStore, lobbyStore, modalHandleStore } from "../../store";
import { HeaderElement, MainElement, Description } from "./components";
import usePreventWrongApproach from "../../hooks/usePreventWrongApproach";
import { HOST_URL } from "../../utils/envProvider";

const LayoutStyle = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  /* border: 1px solid red; */
`;

const S = {
  HeaderLayout: styled(LayoutStyle)`
    flex-basis: 17.8%;
  `,

  MainLayout: styled(LayoutStyle)`
    border: none;
    margin-top: 15px;
    flex-basis: 82.2%;
    height: 82.2%;
  `,
};

const Lobby = () => {
  const location = useLocation();
  usePreventWrongApproach(location.pathname);

  const { socket } = socketStore();
  const { nickname, userColor, roomCode, isMember } = userStore();
  const { setUserList, setHeadCount, isComeBack } = lobbyStore();
  const { setModal } = modalHandleStore();

  const [renderStatus, setRenderStatus] = useState<"valid" | "loading" | "isGaming" | "isFull" | "notExist">("loading");

  useEffect(() => {
    const enterUrl = HOST_URL.concat(location.pathname.split("/lobby")[0]);
    if (!nickname) {
      window.location.replace(enterUrl);
    }

    if (!isComeBack) {
      socket?.emit(
        "join-room",
        { nickname, userColor, roomID: roomCode, isMember },
        (res: { isValid: boolean; reason?: "isGaming" | "isFull" }) => {
          if (res.isValid) {
            setRenderStatus("valid");
          } else if (res.reason !== undefined) {
            setRenderStatus(res.reason);
          }
        }
      );
    } else {
      setRenderStatus("loading");

      socket?.emit("vaild-room", { roomID: roomCode }, (res: { success: boolean; reason?: "notExist" }) => {
        if (res.success) {
          setRenderStatus("valid");
        } else {
          setRenderStatus(res.reason as "notExist");
          setModal("HostDisconnected");
        }
      });
    }

    socket?.on("user-list", ({ userList }: { userList: any }) => {
      setUserList(userList);
      setHeadCount(userList.length);
    });

    return () => {
      socket?.off("user-list");
    };
    // eslint-disable-next-line
  }, []);

  return (
    <Container>
      <>
        {renderStatus === "valid" ? (
          <S.HeaderLayout>
            <HeaderElement />
          </S.HeaderLayout>
        ) : null}
        <S.MainLayout>
          {renderStatus === "valid" ? (
            <MainElement />
          ) : (
            <Description>
              {renderStatus === "loading" ? (
                <p>방에 입장중입니다..</p>
              ) : renderStatus === "isGaming" ? (
                <p>현재 게임이 진행 중인 방입니다</p>
              ) : renderStatus === "isFull" ? (
                <p>방이 가득 찼습니다</p>
              ) : renderStatus === "notExist" ? (
                <p>방이 존재하지 않습니다</p>
              ) : (
                <p> </p>
              )}
            </Description>
          )}
        </S.MainLayout>
      </>
    </Container>
  );
};

export default Lobby;
