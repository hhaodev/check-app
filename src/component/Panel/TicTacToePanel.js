import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
} from "antd";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "../../firebaseConfig";
import { usePageVisibility } from "../../ultis";
import UserField from "../UserField";

const minSize = 5; // Kích thước nhỏ nhất
const maxSize = 15; // Kích thước lớn nhất
const minFontSize = 10; // Kích thước font nhỏ nhất
const maxFontSize = 40; // Kích thước font lớn nhất
const initializeSize = 10;

const TicTacToePanel = ({ open, onClosePanel }) => {
  const { userState } = useAppContext();
  const invisible = usePageVisibility();
  //setting board
  const [boardSize, setBoardSize] = useState(initializeSize);

  //setting create game
  const [openModalSetting, setOpenModalSetting] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [userSelected, setUserSelected] = useState(null);
  const [isX, setIsX] = useState(null);
  const [isO, setIsO] = useState(null);
  const [xNext, setxNext] = useState(false);
  //end

  const [loadingButton, setLoadingButton] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);

  const [layoutPage, setLayoutPage] = useState("none");

  const [gameData, setGameData] = useState(null);
  const [historyGameData, setHistoryGameData] = useState([]);

  const [msgInGame, setMsgInGame] = useState("");

  const fontSize = useMemo(() => {
    return (
      maxFontSize -
      ((gameData?.boardSize - minSize) / (maxSize - minSize)) *
        (maxFontSize - minFontSize)
    );
  }, [gameData]);

  const userSelectedEmail = useMemo(() => {
    return usersList?.find((user) => user.uid === userSelected)?.email;
  }, [userSelected]);

  useEffect(() => {
    if (openModalSetting) {
      getAllUsers();
    } else {
      setUserSelected(null);
      setIsX(null);
      setIsO(null);
    }
  }, [openModalSetting]);

  useEffect(() => {
    if (!open || layoutPage === "ingame") {
      setOpenModalSetting(false);
    }
  }, [open, layoutPage]);

  useEffect(() => {
    setIsO(userSelectedEmail);
  }, [userSelectedEmail]);

  useEffect(() => {
    setIsX(usersList?.find((i) => i.uid === userState.user.uid)?.email);
  }, [usersList]);

  useEffect(() => {
    (async () => {
      if (gameData) {
        const itemDoc = doc(db, "game", gameData.id);
        if (invisible && open) {
          const updatedUserArray = gameData.user.map((user) =>
            user.uid === userState.user.uid
              ? { ...user, inGame: true, isOnline: true }
              : user
          );
          await updateDoc(itemDoc, { user: updatedUserArray });
        } else {
          const updatedUserArray = gameData.user.map((user) =>
            user.uid === userState.user.uid
              ? { ...user, inGame: true, isOnline: false }
              : user
          );
          await updateDoc(itemDoc, { user: updatedUserArray });
        }
      }
    })();
  }, [gameData, invisible, open]);

  const getAllUsers = async () => {
    try {
      const usersCollection = collection(db, "users");

      onSnapshot(usersCollection, (usersSnapshot) => {
        const allUsers = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const gamesCollection = collection(db, "game");
        const gamesQuery = query(
          gamesCollection,
          where("isComplete", "==", false)
        );

        onSnapshot(gamesQuery, (gamesSnapshot) => {
          const userIdsInGame = [];
          gamesSnapshot.forEach((gameDoc) => {
            const gameData = gameDoc.data();
            if (gameData.user && Array.isArray(gameData.user)) {
              gameData.user.forEach((user) => {
                userIdsInGame.push(user);
              });
            }
          });

          const userList = allUsers.filter(
            (user) =>
              !userIdsInGame.some((gameUser) => gameUser.uid === user.uid)
          );

          setUsersList(userList);
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleXChange = (value) => {
    setIsO(value === isX ? isO : isX);
    setIsX(value);
  };

  const handleOChange = (value) => {
    setIsX(value === isX ? isO : isX);
    setIsO(value);
  };

  const handleChangeXnext = (value) => {
    if (value === "X") {
      setxNext(true);
    } else {
      setxNext(false);
    }
  };
  //end setting

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "game"), (querySnapshot) => {
      setGlobalLoading(true);
      try {
        let hasDocuments = false;
        const history = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data) {
            const isCurrentUserInArray = data.user.some(
              (u) => u.uid === userState.user.uid
            );

            if (
              isCurrentUserInArray &&
              data.user.find((u) => u.uid === userState.user.uid).inGame ===
                true &&
              data.isComplete === true
            ) {
              history.push({ id: doc.id, ...data });
            }

            if (
              isCurrentUserInArray &&
              data.user.find((u) => u.uid === userState.user.uid).inGame ===
                true &&
              data.isComplete === false
            ) {
              hasDocuments = true;

              setGameData({ id: doc.id, ...data });

              if (data.quit) {
                setLayoutPage("quit");
              } else if (data.pending) {
                setLayoutPage("pending");
              } else {
                setLayoutPage("ingame");
              }
            }
          }
        });

        setHistoryGameData(history);

        if (!hasDocuments) {
          setGameData(null);
          setLayoutPage("none");
        }
      } catch (error) {
        console.error("Error processing snapshot:", error);
      } finally {
        setGlobalLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateGame = async () => {
    setLoadingButton(true);

    const gamesCollection = collection(db, "game");
    const gamesQuery = query(gamesCollection, where("isComplete", "==", false));
    const gamesSnapshot = await getDocs(gamesQuery);

    const userIdsInGame = [];
    gamesSnapshot.forEach((gameDoc) => {
      const gameData = gameDoc.data();
      if (gameData.user && Array.isArray(gameData.user)) {
        gameData.user.forEach((user) => {
          userIdsInGame.push(user.uid);
        });
      }
    });

    if (userIdsInGame.includes(userSelected)) {
      message.error(
        "Người chơi đang ở trong 1 trận đấu khác, vui lòng thử lại sau!"
      );
      setLoadingButton(false);
      return;
    }

    await addDoc(collection(db, "game"), {
      board: Array(boardSize * boardSize).fill(null),
      boardSize: boardSize,
      isO: isO,
      isX: isX,
      lastCheck: "",
      user: [
        {
          uid: userState.user.uid,
          email: userState.user.email,
          inGame: true,
          isOnline: true,
        },
        {
          uid: userSelected,
          email: userSelectedEmail,
          inGame: false,
          isOnline: false,
        },
      ],
      winningLine: [],
      xIsNext: xNext,
      quit: false,
      pending: true,
      winner: "",
      nextTurn: xNext ? isX : isO,
      isComplete: false,
      msg: [],
    });
    setOpenModalSetting(false);
    setLoadingButton(false);
  };

  const handleCancelGame = async () => {
    setLoadingButton(true);
    await deleteDoc(doc(db, "game", gameData.id));
    setGameData(null);
    setLayoutPage("none");
    setLoadingButton(false);
  };

  const handleOutGame = async () => {
    setLoadingButton(true);

    const itemDoc = doc(db, "game", gameData.id);

    if (!gameData?.winner) {
      await deleteDoc(doc(db, "game", gameData.id));
    } else {
      await updateDoc(itemDoc, {
        isComplete: true,
      });
    }

    setGameData(null);
    setLayoutPage("none");
    setLoadingButton(false);
  };

  const handleSendMsgInGame = async () => {
    const itemDoc = doc(db, "game", gameData.id);
    await updateDoc(itemDoc, {
      msg: arrayUnion({
        sender: userState.user.email,
        message: msgInGame,
        sendAt: Timestamp.fromDate(new Date()),
      }),
    });
    setMsgInGame("");
  };

  //renderLayout
  const renderPageGame = () => {
    switch (layoutPage) {
      case "none":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <Button
              style={{
                padding: "30px 10px",
              }}
              onClick={() => setOpenModalSetting(true)}
            >
              Tạo Game Mới
            </Button>
            {historyGameData?.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div style={{ fontSize: "20px", fontWeight: 700 }}>
                  Lịch sử đánh
                </div>
                <div
                  style={{
                    maxHeight: "calc(100vh - 65px - 48px - 62px - 60px - 20px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    overflow: "auto",
                  }}
                >
                  {historyGameData?.map((i) => {
                    return (
                      <div
                        onClick={() => {
                          setGameData(i);
                          setLayoutPage("viewgame");
                        }}
                        key={i.id}
                        style={{
                          backgroundColor:
                            i.winner === "Hoà"
                              ? "green"
                              : i.winner === userState.user.email
                              ? "#28344E"
                              : "#59343B",
                          borderRadius: "8px",
                          padding: "20px 8px",
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        <div>{`Trận của ${userState.user.email} với ${
                          i?.user?.find((u) => u.uid !== userState.user.uid)
                            .email
                        }`}</div>
                        <div style={{ minWidth: 100 }}>
                          |{" "}
                          {i?.winner === "Hoà"
                            ? "Hoà"
                            : i?.winner === userState.user.email
                            ? "Chiến thắng"
                            : "Thất bại"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontSize: "20px",
                  textAlign: "center",
                  lineHeight: "36px",
                }}
              >
                Bạn chưa chơi game nào! Hãy chơi thử 1 trận nhé.
              </div>
            )}
          </div>
        );
      case "ingame":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: "fit-content" }}>Bên X:</div>
              <UserField
                email={gameData.isX}
                status={
                  gameData?.user.find((u) => u.email === gameData.isX).isOnline
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: "fit-content" }}>Bên O:</div>
              <UserField
                email={gameData.isO}
                status={
                  gameData?.user.find((u) => u.email === gameData.isO).isOnline
                }
              />
            </div>
            {Boolean(gameData.winner) ? (
              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {gameData?.winner === "Hoà"
                  ? `Deo ai thắng cả :)) hoà nhá`
                  : gameData?.winner === userState.user.email
                  ? `Bạn là người chiến thắng!!!`
                  : `Bạn đã thua cuộc!!!`}
              </div>
            ) : (
              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {gameData?.nextTurn !== userState.user.email
                  ? "Lượt đi của đối thủ"
                  : "Đến lượt bạn"}
              </div>
            )}

            <div className="board">{renderBoard()}</div>
            <div
              style={{
                minHeight:
                  "calc(100vh - 65px - 48px - 80px - 80px - 350px - 35px)",
                maxHeight:
                  "calc(100vh - 65px - 48px - 80px - 80px - 350px - 35px)",
                overflow: "auto",
                border: "1px solid #000",
                padding: " 20px",
                borderRadius: 8,
              }}
            >
              {gameData.msg?.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {gameData.msg
                    .sort((a, b) => b?.sendAt?.seconds - a?.sendAt?.seconds)
                    .map((i, index) => (
                      <div key={index}>
                        {i.sender.split("@")[0]}: {i.message}
                      </div>
                    ))}
                </div>
              ) : (
                <>Không có tin nhắn nào</>
              )}
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <Input
                value={msgInGame}
                onChange={(e) => setMsgInGame(e.target.value)}
                placeholder="Nhập tin nhắn"
                style={{ padding: 10 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMsgInGame();
                  }
                }}
              />
              <Button
                disabled={!Boolean(msgInGame)}
                style={{ padding: "22px 20px" }}
                onClick={handleSendMsgInGame}
              >
                Gửi
              </Button>
            </div>
          </div>
        );
      case "pending":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <p
              style={{ textAlign: "center", lineHeight: 1.5 }}
            >{`Đang chờ người chơi "${
              gameData?.user?.find((u) => u.uid !== userState?.user?.uid)?.email
            }" chấp nhận trận đấu.`}</p>
            <Button loading={loadingButton} onClick={handleCancelGame}>
              Huỷ trận đấu
            </Button>
          </div>
        );
      case "quit":
        return (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexDirection: "column",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <p style={{ textAlign: "center", lineHeight: 1.5 }}>{`Người chơi "${
              gameData?.user?.find((u) => u.uid !== userState?.user?.uid)?.email
            }" đã từ chối trận đấu.`}</p>
            <Button onClick={handleCancelGame}>Thoát</Button>
          </div>
        );
      case "viewgame":
        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <div>{`Bên X: ${gameData.isX}`}</div>
            <div>{`Bên O: ${gameData.isO}`}</div>
            {Boolean(gameData.winner) ? (
              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {gameData?.winner === "Hoà"
                  ? `Deo ai thắng cả :)) hoà `
                  : gameData?.winner === userState.user.email
                  ? `Bạn là người chiến thắng!!!`
                  : `Bạn đã thua cuộc!!!`}
              </div>
            ) : (
              <div
                style={{
                  padding: 10,
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {gameData?.nextTurn !== userState.user.email
                  ? "Lượt đi của đối thủ"
                  : "Đến lượt bạn"}
              </div>
            )}

            <div className="board">{renderBoard()}</div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleSizeChange = (value) => {
    const newSize = parseInt(value, 10);
    setBoardSize(newSize);
  };

  const handleClick = async (index) => {
    if (gameData?.board[index] || gameData?.winner) return;
    if (gameData?.nextTurn !== userState.user.email) {
      message.error("Không phải lượt của bạn!");
      return;
    }

    const newBoard = gameData?.board?.slice();

    newBoard[index] = gameData?.xIsNext ? "X" : "O";

    const itemDoc = doc(db, "game", gameData.id);

    await updateDoc(itemDoc, {
      board: newBoard,
      xIsNext: !gameData.xIsNext,
      lastCheck: index.toString(),
      nextTurn: getNextTurn(),
    });

    const result = calculateWinner(newBoard);
    if (result) {
      await updateDoc(itemDoc, {
        winner: result.winner === "X" ? gameData?.isX : gameData?.isO,
        winningLine: result.winningLine,
        lastCheck: "",
      });
    } else if (newBoard.every((square) => square !== null)) {
      await updateDoc(itemDoc, {
        winner: "Hoà",
      });
    }
  };

  const getNextTurn = () => {
    const nextPlayerUid = gameData.user.find(
      (u) => u.uid !== userState.user.uid
    )?.email;
    return nextPlayerUid || gameData.user[0].email;
  };

  const isBlocked = (board, line, direction) => {
    const [a, b, _, d, e] = line;
    let nextIndex;

    if (direction === -1) {
      nextIndex = a - (b - a);
      nextIndex = e + (e - d);

      return (
        nextIndex < 0 || nextIndex >= board.length || board[nextIndex] !== null
      );
    }
  };

  const calculateWinner = (board) => {
    const lines = generateWinningLines(gameData?.boardSize);

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c, d, e] = lines[i];

      if (
        board[a] &&
        board[a] === board[b] &&
        board[a] === board[c] &&
        board[a] === board[d] &&
        board[a] === board[e]
      ) {
        const leftBlocked = isBlocked(board, lines[i], -1);
        const rightBlocked = isBlocked(board, lines[i], -1);

        if (!(leftBlocked && rightBlocked)) {
          return { winner: board[a], winningLine: [a, b, c, d, e] };
        }
      }
    }
    return null;
  };

  const generateWinningLines = (size) => {
    const lines = [];

    // Các hàng
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          i * size + j,
          i * size + j + 1,
          i * size + j + 2,
          i * size + j + 3,
          i * size + j + 4,
        ]);
      }
    }

    // Các cột
    for (let i = 0; i < size; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          j * size + i,
          (j + 1) * size + i,
          (j + 2) * size + i,
          (j + 3) * size + i,
          (j + 4) * size + i,
        ]);
      }
    }

    // Đường chéo chính
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 0; j <= size - 5; j++) {
        lines.push([
          i * size + j,
          (i + 1) * size + j + 1,
          (i + 2) * size + j + 2,
          (i + 3) * size + j + 3,
          (i + 4) * size + j + 4,
        ]);
      }
    }

    // Đường chéo phụ
    for (let i = 0; i <= size - 5; i++) {
      for (let j = 4; j < size; j++) {
        lines.push([
          i * size + j,
          (i + 1) * size + j - 1,
          (i + 2) * size + j - 2,
          (i + 3) * size + j - 3,
          (i + 4) * size + j - 4,
        ]);
      }
    }

    return lines;
  };

  const renderSquare = (index) => {
    const isWinningSquare = gameData?.winningLine.includes(index);
    return (
      <button
        style={{
          backgroundColor: isWinningSquare
            ? "yellow"
            : index === parseInt(gameData?.lastCheck)
            ? "rgb(71, 71, 71)"
            : "transparent",
          color: isWinningSquare ? "red" : "",
          fontSize: `${fontSize}px`,
        }}
        key={index}
        className="square"
        onClick={() => handleClick(index)}
      >
        {gameData?.board[index]}
      </button>
    );
  };

  const renderBoard = () => {
    let squares = [];
    for (let i = 0; i < gameData?.boardSize; i++) {
      let row = [];
      for (let j = 0; j < gameData?.boardSize; j++) {
        row.push(renderSquare(i * gameData?.boardSize + j));
      }
      squares.push(
        <div key={i} className="board-row">
          {row}
        </div>
      );
    }
    return squares;
  };

  return (
    <Drawer
      zIndex={2000}
      closable={false}
      open={open}
      title="X O Game"
      extra={
        <Space>
          {layoutPage === "ingame" &&
            (gameData?.winner ? (
              <Button onClick={handleOutGame}>Thoát Game</Button>
            ) : (
              <Popconfirm
                title="Thoát game!!!"
                description={`Khi chưa tìm ra người chiến thắng mà thoát game, dữ liệu của game này sẽ không được ghi lại. Bạn có thể sử dụng nút "X" phía trên góc phải để có thể chơi tiếp ván này vào lúc khác.`}
                onConfirm={handleOutGame}
                okText="Thoát"
                cancelText="Chơi tiếp"
              >
                <Button>Thoát Game</Button>
              </Popconfirm>
            ))}
          {layoutPage === "viewgame" ? (
            <Button
              onClick={() => {
                setGameData(null);
                setLayoutPage("none");
              }}
            >
              X
            </Button>
          ) : (
            <Button onClick={onClosePanel}>X</Button>
          )}
        </Space>
      }
    >
      {globalLoading && (
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />} />
        </div>
      )}
      {!globalLoading && <>{renderPageGame()}</>}
      <Modal
        title={<div style={{ textAlign: "center" }}>Cài đặt game</div>}
        open={openModalSetting}
        closable={false}
        footer={null}
        onCancel={() => setOpenModalSetting(false)}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* size board */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ minWidth: "fit-content" }}>Kích thước bàn game: </div>
            <Select
              style={{ width: "100%" }}
              onChange={handleSizeChange}
              value={boardSize}
            >
              {Array.from({ length: 6 }, (_, i) => i + 10).map((value) => (
                <Select.Option key={value} value={value}>
                  {value}
                </Select.Option>
              ))}
            </Select>
          </div>
          {/* mời người chơi khác */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ width: "100px" }}>Mời bạn: </div>
            <Select
              showSearch
              style={{ width: "100%" }}
              placeholder="Search or select"
              optionFilterProp="label"
              filterSort={(optionA, optionB) =>
                (optionA?.label ?? "")
                  .toLowerCase()
                  .localeCompare((optionB?.label ?? "").toLowerCase())
              }
              value={userSelected}
              onChange={(v) => setUserSelected(v)}
            >
              {usersList
                .filter((i) => i.uid !== userState.user.uid)
                ?.map((v) => (
                  <Select.Option key={v.uid} value={v.uid} label={v.email}>
                    <div
                      style={{
                        maxWidth: "calc(375px - 40px - 80px - 50px - 20px)",
                      }}
                    >
                      <UserField email={v.email} status={v.isOnline} />
                    </div>
                  </Select.Option>
                ))}
              <Select.Option></Select.Option>
            </Select>
          </div>
          {/* chọn bên X bên O */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ width: "100px" }}>Bên X: </div>
            <Select
              disabled={!userSelected}
              style={{ width: "100%" }}
              value={isX}
              onChange={(v) => handleXChange(v)}
            >
              <Select.Option
                value={userState.user.email}
                label={userState.user.email}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      maxWidth: "calc(375px - 40px - 100px - 50px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userState.user.email}
                  </span>
                </div>
              </Select.Option>
              <Select.Option
                value={userSelectedEmail}
                label={userSelectedEmail}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      maxWidth: "calc(375px - 40px - 100px - 50px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userSelectedEmail}
                  </span>
                </div>
              </Select.Option>
            </Select>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ width: "100px" }}>Bên O: </div>
            <Select
              disabled={!userSelected}
              style={{ width: "100%" }}
              value={isO}
              onChange={(v) => handleOChange(v)}
            >
              <Select.Option
                value={userState.user.email}
                label={userState.user.email}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      maxWidth: "calc(375px - 40px - 100px - 50px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userState.user.email}
                  </span>
                </div>
              </Select.Option>
              <Select.Option
                value={userSelectedEmail}
                label={userSelectedEmail}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      maxWidth: "calc(375px - 40px - 100px - 50px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {userSelectedEmail}
                  </span>
                </div>
              </Select.Option>
            </Select>
          </div>
          {/* bên đi trước */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div style={{ minWidth: "fit-content" }}>Bên đi trước: </div>
            <Select
              value={xNext ? "X" : "O"}
              style={{ width: "100%" }}
              options={[
                { value: "X", label: "Bên X" },
                { value: "O", label: "Bên O" },
              ]}
              onChange={handleChangeXnext}
            />
          </div>

          {/* submit */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "20px",
              gap: "20px",
            }}
          >
            <Button
              loading={loadingButton}
              onClick={() => handleCreateGame()}
              disabled={!userSelected}
              style={{
                padding: "20px",
              }}
            >
              Tạo Game
            </Button>
            <Button onClick={() => setOpenModalSetting(false)}>Huỷ</Button>
          </div>
        </div>
      </Modal>
    </Drawer>
  );
};

export default TicTacToePanel;
