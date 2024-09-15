import { LoadingOutlined } from "@ant-design/icons";
import { Button, Drawer, message, Modal, Select, Space, Spin } from "antd";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { db } from "../../firebaseConfig";

const minSize = 5; // Kích thước nhỏ nhất
const maxSize = 15; // Kích thước lớn nhất
const minFontSize = 10; // Kích thước font nhỏ nhất
const maxFontSize = 40; // Kích thước font lớn nhất
const initializeSize = 10;

const TicTacToePanel = ({ open, onClosePanel }) => {
  const { userState } = useAppContext();
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
    setIsO(userSelectedEmail);
  }, [userSelectedEmail]);

  useEffect(() => {
    setIsX(usersList?.find((i) => i.uid === userState.user.uid)?.email);
  }, [usersList]);

  const getAllUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const userList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsersList(userList);
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

  //lắng nghe có đang trong game hay k
  useEffect(() => {
    if (open) {
      const unsubscribe = onSnapshot(
        collection(db, "game"),
        (querySnapshot) => {
          setGlobalLoading(true);
          try {
            let hasDocuments = false;

            querySnapshot.forEach((doc) => {
              hasDocuments = true;

              const data = doc.data();
              if (data) {
                setGameData({ id: doc.id, ...data });
                const isCurrentUserInArray = data.user.some(
                  (u) => u.uid === userState.user.uid
                );

                if (
                  isCurrentUserInArray &&
                  data.user.find((u) => u.uid === userState.user.uid).inGame ===
                    true
                ) {
                  if (data.quit) {
                    setLayoutPage("quit");
                  } else if (data.pending) {
                    setLayoutPage("pending");
                  } else {
                    setLayoutPage("ingame");
                  }
                } else {
                  setGameData(null);
                  setLayoutPage("none");
                }
              }
            });

            if (!hasDocuments) {
              setGameData(null);
              setLayoutPage("none");
            }
          } catch (error) {
            console.error("Error processing snapshot:", error);
          } finally {
            setGlobalLoading(false);
          }
        }
      );

      return () => unsubscribe();
    }
  }, [open]);

  const handleCreateGame = async () => {
    setLoadingButton(true);
    await addDoc(collection(db, "game"), {
      board: Array(boardSize * boardSize).fill(null),
      boardSize: boardSize,
      isO: isO,
      isX: isX,
      lastCheck: "",
      user: [
        { uid: userState.user.uid, email: userState.user.email, inGame: true },
        {
          uid: userSelected,
          email: userSelectedEmail,
          inGame: false,
        },
      ],
      winningLine: [],
      xIsNext: xNext,
      quit: false,
      pending: true,
      winner: "",
      nextTurn: xNext ? isX : isO,
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

  //renderLayout
  const renderPageGame = () => {
    switch (layoutPage) {
      case "none":
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
            <Button onClick={() => setOpenModalSetting(true)}>Tạo Game</Button>
          </div>
        );
      case "ingame":
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
                {gameData?.winner === userState.user.email
                  ? `Người chiến thắng: ${gameData.winner}`
                  : `Bạn đã thua cuộc`}
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
            }" chấp nhận trấn đấu.`}</p>
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
    const [a, b, c, d, e] = line;
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
        const rightBlocked = isBlocked(board, lines[i], 1);

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
      closable={false}
      open={open}
      title="X O Game"
      extra={
        <Space>
          {layoutPage === "ingame" && (
            <Button onClick={handleCancelGame}>Thoát Game</Button>
          )}
          <Button onClick={onClosePanel}>X</Button>
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
              {Array.from({ length: 11 }, (_, i) => i + 5).map((value) => (
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
            <div style={{ minWidth: "fit-content" }}>Mời người chơi: </div>
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
              options={usersList
                .filter((i) => i.uid !== userState.user.uid)
                ?.map((v) => ({
                  value: v.uid,
                  label: v.email,
                }))}
              onChange={(v) => setUserSelected(v)}
            />
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
              options={[
                {
                  value: userState.user.email,
                  label: userState.user.email,
                },
                { value: userSelectedEmail, label: userSelectedEmail },
              ]}
              onChange={(v) => handleXChange(v)}
            />
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
              options={[
                {
                  value: userState.user.email,
                  label: userState.user.email,
                },
                { value: userSelectedEmail, label: userSelectedEmail },
              ]}
              onChange={(v) => handleOChange(v)}
            />
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
