import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { socketStore, lobbyStore, userStore, modalHandleStore } from "../../../store";
import PlayerAuth from "./PlayerAuth";
import { Button, UserCard } from "../../../components";
import DropDown from "../../../assets/img/dropdown.svg";
import { HOST_URL } from "../../../utils/envProvider";

const FlexAlignStyle = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const LayoutStyle = styled(FlexAlignStyle)`
  flex-direction: column;
  width: 100%;
  border-radius: 12px;
`;

const S = {
  MainWrapper: styled(LayoutStyle)`
    flex-direction: row;

    justify-content: space-between;
    border: none;
    height: 100%;
  `,
  PlayerListWrapper: styled(LayoutStyle)`
    border: 2px solid lightgray;
    flex-basis: 34%;
    height: 631px;
  `,
  PlayerListTop: styled(LayoutStyle)`
    flex-direction: row;
    flex-basis: 9.3%;
    border-radius: 0px;
    border-bottom: 1.5px solid lightgray;
  `,
  Player: styled(LayoutStyle)`
    flex-direction: row;
    justify-content: start;
    margin-left: 15px;
  `,
  PlayerCount: styled(LayoutStyle)`
    flex-direction: row;
    justify-content: end;
    margin-right: 15px;
  `,

  PlayerListBottom: styled(LayoutStyle)`
    flex-basis: 90.7%;
    height: 90.7%;
  `,

  SelectorLayout: styled(LayoutStyle)`
    flex-basis: 12.6%;
  `,
  PlayerCountLayout: styled(LayoutStyle)`
    width: 80%;
    height: 60px;
  `,
  PlayerSelectorLabel: styled.label`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;

    &::before {
      content: "";
      width: 25px;
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 40px;
      background-image: url(${DropDown});
      background-repeat: no-repeat;
      background-position: center center;
    }
  `,
  UserPlayerCount: styled(FlexAlignStyle)`
    border: 1px solid darkgray;
    border-radius: 12px;
    width: 250px;
    height: 40px;
    color: #363636;
  `,
  PlayerSelector: styled.select`
    z-index: 2;
    background: transparent;
    appearance: none;
    width: 80%;
    height: 70%;
    border-radius: 12px;
    padding-left: 10px;
    font-size: 18px;
    font-weight: 400;
    &:focus {
      outline: none;
    }
  `,
  PlayerListLayout: styled(LayoutStyle)`
    justify-content: start;
    flex-basis: 87.4%;
    overflow-y: overlay;
    &::-webkit-scrollbar {
      width: 7px;
    }
  `,
  GameListWrapper: styled(LayoutStyle)`
    flex-basis: 64.2%;
    border: 2px solid lightgray;
    height: 100%;
  `,
  PlayerAuth: styled(FlexAlignStyle)`
    border-radius: 50%;
    width: 35px;
    height: 35px;
  `,
};

const MainElement = () => {
  const navigate = useNavigate();

  const location = useLocation();

  const { socket } = socketStore();
  const { isHost, roomCode } = userStore();
  const { userList, headCount } = lobbyStore();
  const { setModal } = modalHandleStore();

  const [population, setPopulation] = useState(4);
  const [element, setElement] = useState<JSX.Element[]>([]);

  const populationList: number[] = [2, 3, 4, 5, 6, 7, 8];
  const inviteCode = HOST_URL.concat(location.pathname.split("/lobby")[0]);
  const optionList: JSX.Element[] = populationList.map((data) => {
    return (
      <option value={data} key={data}>
        플레이어 {data}명
      </option>
    );
  });

  const kickPlayer = (event: React.MouseEvent<HTMLElement>) => {
    const index: string | null = event.currentTarget.getAttribute("data-react-key");
    if (index !== null) {
      socket?.emit("kick-user", { roomID: roomCode, socketID: userList[parseInt(index, 10)].socketID });
      console.log(`강퇴당한 사람은 ${userList[parseInt(index, 10)].nickname} 입니다`);
    }
  };

  const addUserLayout = () => {
    const temp: JSX.Element[] = [];

    for (let i = 0; i < population; i += 1) {
      temp.push(
        userList[i] ? (
          <UserCard
            divWidth="50px"
            profileColor={`${userList[i].userColor}`}
            nickname={`${userList[i].nickname}`}
            isMe={socket?.id === userList[i].socketID}
            usage="Lobby"
            isMember={userList[i].isMember}
          >
            <PlayerAuth isHost={isHost} useradmin={userList[i].admin} kickPlayer={kickPlayer} index={i} />
          </UserCard>
        ) : (
          <UserCard divWidth="50px" profileColor="black" nickname="비어있음" usage="Lobby">
            <p> </p>
          </UserCard>
        )
      );
    }
    setElement(temp);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const max = parseInt(e.currentTarget.value, 10);

    if (max < parseInt(headCount, 10)) {
      alert("최대 인원은 현재 인원보다 적을 수 없습니다");
      return;
    }
    socket?.emit("set-max-players", { roomID: roomCode, maxPlayers: max });
  };

  const gameStart = () => {
    if (socket) {
      socket.emit("reaction-selected", {
        roomID: roomCode,
      });
    }
  };

  const generateInviteCode = () => {
    try {
      alert("클립보드에 복사되었습니다.");
    } catch (error) {
      alert("클립보드 복사에 실패하였습니다.");
    }
  };

  useEffect(() => {
    socket?.on("reaction-selected", () => {
      navigate(`/${roomCode}/reaction`);
    });
    socket?.on("get-max-players", ({ maxPlayers }) => {
      setPopulation(maxPlayers);
    });
    socket?.on("admin-exit", () => {
      setModal("HostDisconnected");
    });
    socket?.on("kicked", () => {
      setModal("Kicked");
    });
    socket?.emit("get-max-players", { roomID: roomCode }, ({ maxPlayers }: { maxPlayers: number }) => {
      setPopulation(maxPlayers);
    });

    return () => {
      socket?.off("reaction-selected");
      socket?.off("get-max-players");
      socket?.off("admin-exit");
      socket?.off("kicked");
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    addUserLayout();
    // eslint-disable-next-line
  }, [population, userList]);

  return (
    <S.MainWrapper>
      <S.PlayerListWrapper>
        <S.PlayerListTop>
          <S.Player>
            <p style={{ fontWeight: "550", fontSize: "18px" }}>플레이어</p>
          </S.Player>
          <S.PlayerCount>
            <p style={{ fontWeight: "550", fontSize: "16px" }}>
              {headCount}/{population}
            </p>
          </S.PlayerCount>
        </S.PlayerListTop>

        <S.PlayerListBottom>
          <S.SelectorLayout>
            <S.PlayerCountLayout>
              {isHost ? (
                <S.PlayerSelectorLabel>
                  <S.PlayerSelector onChange={handleSelect} value={population}>
                    {optionList}
                  </S.PlayerSelector>
                </S.PlayerSelectorLabel>
              ) : (
                <S.UserPlayerCount>
                  <p style={{ fontWeight: "600" }}>최대 플레이어 {population}명</p>
                </S.UserPlayerCount>
              )}
            </S.PlayerCountLayout>
          </S.SelectorLayout>
          <S.PlayerListLayout>{element}</S.PlayerListLayout>
        </S.PlayerListBottom>
      </S.PlayerListWrapper>

      <S.GameListWrapper>
        {isHost === true ? (
          <Button onClick={gameStart}>게임 시작</Button>
        ) : (
          <div style={{ fontWeight: "600", fontSize: "20px" }}>
            방장이 게임을 시작할 때 까지 잠시만 기다려 주세요 :)
          </div>
        )}
        <br />
        <CopyToClipboard text={inviteCode}>
          <Button onClick={generateInviteCode}>초대 코드 복사</Button>
        </CopyToClipboard>
      </S.GameListWrapper>
    </S.MainWrapper>
  );
};

export default MainElement;
