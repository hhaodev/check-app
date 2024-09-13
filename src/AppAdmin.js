import {
  Badge,
  Button,
  Card,
  Drawer,
  Input,
  Layout,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  theme,
} from "antd";
import "./App.css";
import { Content } from "antd/es/layout/layout";
import { db } from "./firebaseConfig";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import HeaderApp from "./component/Header";
import {
  CarryOutOutlined,
  FormOutlined,
  LoadingOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useAppContext, useCustomTheme } from "./context/AppContext";
import image from "./assets/pn.png";
import image2 from "./assets/146defa1-583e-467a-a7d2-29f7e3dc9cb5.png";
import image1 from "./assets/e7afd37c-b941-4942-bff0-f8b19e7cd45c.png";
import { filterNotes, formatTime } from "./ultis";

function AppAdmin() {
  const theme = useCustomTheme();
  const { TextArea } = Input;
  const { userState } = useAppContext();

  const [todayDocId, setTodayDocId] = useState();
  const [todayChecked, setTodayChecked] = useState(false);
  const [content, setContent] = useState("");
  const [modalType, setModalType] = useState();

  //msg region
  const [contentReply, setContentReply] = useState("");
  const [msgId, setMsgId] = useState([]);
  const [msgContent, setMsgContent] = useState([]);
  const [msgContentNotSeen, setMsgContentNotSeen] = useState([]);
  const [openModalMsg, setOpenModalMsg] = useState(false);

  //loading region
  const [loading, setLoading] = useState(true);
  const [isHandleReply, setIsHandlingReply] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  //error region
  const [error, setError] = useState(false);

  //panel region
  const [openPanel, setOpenPanel] = useState(false);
  const [openChildrenPanel, setOpenChildrenPanel] = useState(false);

  //notes region
  const [notes, setNotes] = useState([]);

  //option add note
  const [usersList, setUsersList] = useState([]);
  const [level, setLevel] = useState("normal");
  const [userSelected, setUserSelected] = useState("");
  const [descriptionNote, setDescriptionNote] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  //filter panel region
  const [openFilterPanel, setOpenFilterPanel] = useState(false);
  const [paramsFilter, setParamsFilter] = useState({
    level: "all",
    noteTo: "all",
    owner: "all",
    done: "all",
  });
  const [paramsFilterClone, setParamsFilterClone] = useState({
    level: "all",
    noteTo: "all",
    owner: "all",
    done: "all",
  });

  const userEmail = useMemo(() => {
    return usersList?.find((user) => user.uid === userSelected)?.email;
  }, [userSelected]);

  const isDefaultFilter = useMemo(() => {
    return (
      paramsFilter.level === "all" &&
      paramsFilter.noteTo === "all" &&
      paramsFilter.owner === "all" &&
      paramsFilter.done === "all"
    );
  }, [paramsFilter]);
  const isDefaultFilterClone = useMemo(() => {
    return (
      paramsFilterClone.level === "all" &&
      paramsFilterClone.noteTo === "all" &&
      paramsFilterClone.owner === "all" &&
      paramsFilterClone.done === "all"
    );
  }, [paramsFilterClone]);

  useEffect(() => {
    if (openFilterPanel) {
      setParamsFilterClone(paramsFilter);
    }
  }, [openFilterPanel]);

  const filteredNote = filterNotes(notes, paramsFilter);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "check"), (querySnapshot) => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const itemDate = new Date(data.day.seconds * 1000);
          itemDate.setHours(0, 0, 0, 0);
          setTodayDocId(doc.id);

          if (itemDate.getTime() === today.getTime()) {
            setTodayChecked(data.checked);
            setError(false);
          } else {
            setError(true);
          }
        });
      } catch (error) {
        console.error("Error processing snapshot:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  //get notebook
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "notes"), (querySnapshot) => {
      try {
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotes(data);
      } catch (error) {
        console.error("Error processing snapshot:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (openPanel) {
      getOptionsAddNote();
    } else {
      setUsersList([]);
      setUserSelected("");
    }
  }, [openPanel, openChildrenPanel]);

  const getOptionsAddNote = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsersList(usersList);
      setUserSelected(
        usersList?.filter((user) => user.uid !== userState?.user?.uid)[0]?.uid
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isHandleReply) {
      const unsubscribe = onSnapshot(collection(db, "msg"), (querySnapshot) => {
        try {
          const msgId = [];
          const msgContent = [];
          const msgContentNotSeen = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.author !== userState.user.uid && data.isSeen === false) {
              msgId.push(doc.id);
              msgContent.push(data);
              setOpenModalMsg(true);
            }

            if (data.author === userState.user.uid && data.isSeen === false) {
              msgContentNotSeen.push(data);
            }
          });

          msgContent.sort((a, b) => {
            return b.sendAt.seconds - a.sendAt.seconds;
          });
          msgContentNotSeen.sort((a, b) => {
            return b.sendAt.seconds - a.sendAt.seconds;
          });

          setMsgId(msgId);
          setMsgContent(msgContent);
          setMsgContentNotSeen(msgContentNotSeen);
        } catch (error) {
          console.error("Error processing snapshot:", error);
        }
      });

      return () => unsubscribe();
    }
  }, [isHandleReply]);

  const handleSendMsgOrTitle = async () => {
    setIsButtonLoading(true);
    if (!todayDocId) return;

    if (modalType === "editTitle") {
      const itemDoc = doc(db, "check", todayDocId);
      await updateDoc(itemDoc, { title: content });
    } else if (modalType === "sendMsg") {
      await addDoc(collection(db, "msg"), {
        author: userState.user.uid,
        text: content,
        isSeen: false,
        sendAt: Timestamp.fromDate(new Date()),
      });
    }
    setModalType("");
    setContent("");
    setIsButtonLoading(false);
  };

  const handleReplyMsg = async () => {
    setIsHandlingReply(true);

    try {
      for (const i of msgId) {
        await deleteDoc(doc(db, "msg", i));
      }

      if (Boolean(contentReply)) {
        await addDoc(collection(db, "msg"), {
          author: userState.user.uid,
          text: contentReply,
          isSeen: false,
          sendAt: Timestamp.fromDate(new Date()),
        });
        setContentReply("");
      }
    } catch (error) {
      console.error("Error handling reply message:", error);
    } finally {
      setMsgId([]);
      setMsgContent([]);
      setOpenModalMsg(false);
      setIsHandlingReply(false);
    }
  };

  const renderTitle = (level, owner, noteTo) => {
    let lev;
    switch (level) {
      case "low":
        lev = <Tag color="lime">Thấp 😁</Tag>;
        break;
      case "mid":
        lev = <Tag color="orange">Trung bình 😕</Tag>;
        break;
      case "high":
        lev = <Tag color="red">Cao 😱</Tag>;
        break;
      case "normal":
        lev = <Tag color="blue">Bình thường 😬</Tag>;
        break;
      default:
        lev = <Tag color="blue">Bình thường 😬</Tag>;
    }
    return (
      <div style={{ padding: 5 }}>
        <div>Độ ưu tiên: {lev}</div>
        <div style={{ fontSize: 12 }}>
          Người tạo: {owner?.email?.split("@")[0]}
        </div>
        <div style={{ fontSize: 12 }}>
          Dành cho: {noteTo?.email?.split("@")[0]}
        </div>
      </div>
    );
  };

  const handleAddNote = async () => {
    if (!descriptionNote) {
      setErrorMessage(true);
      return;
    }
    try {
      const notesCollection = collection(db, "notes");

      await addDoc(notesCollection, {
        description: descriptionNote,
        done: false,
        level: level,
        noteTo: {
          email: userEmail,
          uid: userSelected,
        },
        owner: {
          email: userState.user.email,
          uid: userState.user.uid,
        },
        createAt: Timestamp.fromDate(new Date()),
      });
      if (userSelected !== userState.user.uid) {
        message.success("Em đã nhận được note của anh <3");
      } else if (userSelected === userState.user.uid) {
        message.success("Tạo note thành công!");
      }
      setLevel("normal");
      setDescriptionNote("");
      setOpenChildrenPanel(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const renderTitleTag = (level) => {
    switch (level) {
      case "low":
        return "Thấp";
      case "mid":
        return "Trung bình";
      case "high":
        return "Cao";
      case "normal":
        return "Bình thường";
      default:
        return "Bình thường";
    }
  };

  const renderTagFilter = () => {
    const tags = [];
    if (paramsFilter.level !== "all") {
      tags.push(
        <Tag
          closeIcon
          onClose={() => {
            setParamsFilter((pre) => ({ ...pre, level: "all" }));
          }}
          key="level"
        >
          Độ ưu tiên: {renderTitleTag(paramsFilter.level)}
        </Tag>
      );
    }

    if (paramsFilter.noteTo !== "all") {
      tags.push(
        <Tag
          closeIcon
          onClose={() => {
            setParamsFilter((pre) => ({ ...pre, noteTo: "all" }));
          }}
          key="noteTo"
        >
          Dành cho:{" "}
          {
            usersList
              ?.find((user) => user.uid === paramsFilter.noteTo)
              ?.email?.split("@")[0]
          }
        </Tag>
      );
    }

    if (paramsFilter.owner !== "all") {
      tags.push(
        <Tag
          closeIcon
          onClose={() => {
            setParamsFilter((pre) => ({ ...pre, owner: "all" }));
          }}
          key="owner"
        >
          Người tạo:{" "}
          {
            usersList
              ?.find((user) => user.uid === paramsFilter.owner)
              ?.email?.split("@")[0]
          }
        </Tag>
      );
    }

    if (paramsFilter.done !== "all") {
      tags.push(
        <Tag
          closeIcon
          onClose={() => {
            setParamsFilter((pre) => ({ ...pre, done: "all" }));
          }}
          key="done"
        >
          Trạng trái: {paramsFilter.done === true ? "Đã xong" : "Chưa xong"}
        </Tag>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {tags.map((i) => (
          <div style={{ margin: "5px 0px" }}>{i}</div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="app">
        <Layout className="layout">
          <HeaderApp />
          {loading && (
            <div
              style={{
                width: "100%",
                height: "100vh",
                backgroundColor: theme.backgroundColorBase,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Spin
                indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}
              />
            </div>
          )}
          {!loading && (
            <Content className="content">
              {!loading && !error && (
                <>
                  {todayChecked ? (
                    <>
                      <div>{`hôm nay em đã uống thuốc rồi :)))`}</div>
                      <img
                        alt=""
                        src={image}
                        style={{
                          width: "80%",
                          objectFit: "contain",
                          borderRadius: "8px",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div>{`hôm nay em chưa uống thuốc !!!!`}</div>
                      <img
                        alt=""
                        src={image2}
                        style={{
                          width: "80%",
                          objectFit: "contain",
                          borderRadius: "8px",
                        }}
                      />
                    </>
                  )}
                </>
              )}
              {error && (
                <>
                  <div>{`có gì đó sai sai, tải lại trang xem !!`}</div>
                  <img
                    alt=""
                    src={image1}
                    style={{
                      width: "80%",
                      objectFit: "contain",
                      borderRadius: "8px",
                    }}
                  />
                </>
              )}
            </Content>
          )}
        </Layout>
        <div
          style={{
            padding: "15px 40px",
            display: "flex",
            justifyContent: "end",
            gap: 30,
            width: "100%",
            height: "100px",
            backgroundColor: theme.colorBackgroundBase,
          }}
        >
          {!todayChecked && !loading && !error && (
            <Button
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
              icon={<FormOutlined />}
              onClick={() => {
                setModalType("editTitle");
              }}
            />
          )}
          <Badge
            count={
              notes?.filter(
                (note) =>
                  note.done === false && note.noteTo.uid === userState.user.uid
              )?.length
            }
          >
            <Button
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
              icon={<CarryOutOutlined />}
              onClick={() => {
                setParamsFilter((pre) => ({
                  ...pre,
                  noteTo: userState.user.uid,
                  done: false,
                }));
                setOpenPanel(true);
              }}
            />
          </Badge>
          <Badge count={msgContentNotSeen?.length}>
            <Button
              onClick={() => {
                setModalType("sendMsg");
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
              icon={<MessageOutlined />}
            />
          </Badge>
        </div>
      </div>
      <Modal
        style={{ top: "25%" }}
        closable={false}
        width={320}
        open={modalType === "sendMsg" || modalType === "editTitle"}
        footer={null}
        onCancel={() => {
          setContent("");
          setModalType("");
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {msgContentNotSeen.length > 0 && modalType === "sendMsg" && (
            <>
              <>tin nhắn người ấy chưa xem</>
              {msgContentNotSeen?.map((i, index) => {
                return (
                  <div
                    style={{
                      backgroundColor: theme.colorBackgroundDiv,
                      borderRadius: "8px",
                      padding: "8px",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                    key={index}
                  >
                    {`"${i?.text}" `}
                    <div
                      style={{
                        fontSize: 10,
                        whiteSpace: "nowrap",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      {`${formatTime(i?.sendAt)}`}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          <TextArea
            autoFocus
            autoSize={{ minRows: 3 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${
              modalType === "editTitle"
                ? "lời nhắc nhở uống thuốc :))"
                : "gửi tin nhắn cho người ấy :))"
            }`}
          />
          <Button
            loading={isButtonLoading}
            disabled={!Boolean(content)}
            onClick={() => handleSendMsgOrTitle()}
          >
            Oske nhoo !!
          </Button>
        </div>
      </Modal>
      <Modal
        style={{ top: "25%" }}
        closable={false}
        width={320}
        open={openModalMsg}
        footer={null}
        onCancel={() => handleReplyMsg()}
        title={
          <div
            style={{ textAlign: "center" }}
          >{`tin nhắn từ người ấy :))`}</div>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            width: "100%",
          }}
        >
          {msgContent?.map((i, index) => {
            return (
              <div
                style={{
                  backgroundColor: theme.colorBackgroundDiv,
                  borderRadius: "8px",
                  padding: "8px",
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                key={index}
              >
                {`"${i?.text}"`}
                <div
                  style={{
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {`${formatTime(i?.sendAt)}`}
                </div>
              </div>
            );
          })}

          <TextArea
            autoFocus
            autoSize={{ minRows: 3 }}
            value={contentReply}
            onChange={(e) => setContentReply(e.target.value)}
            placeholder="reply???"
          />
          <Button loading={isHandleReply} onClick={() => handleReplyMsg()}>
            Oske nhoo !!
          </Button>
        </div>
      </Modal>
      <Drawer
        title="NoteBook"
        onClose={() => setOpenPanel(false)}
        open={openPanel}
        closable={false}
        extra={
          <Space>
            <Button type="primary" onClick={() => setOpenFilterPanel(true)}>
              Bộ lọc
            </Button>
            <Button type="primary" onClick={() => setOpenChildrenPanel(true)}>
              Tạo note
            </Button>
            <Button onClick={() => setOpenPanel(false)}>X</Button>
          </Space>
        }
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {!isDefaultFilter && <div>{renderTagFilter()}</div>}
          {(isDefaultFilter ? notes : filteredNote)?.map((i) => {
            return (
              <Card
                key={i.id}
                size="small"
                title={renderTitle(i.level, i.owner, i.noteTo)}
                extra={
                  <Tag.CheckableTag
                    style={{
                      border: "1px solid #000",
                    }}
                    checked={i.done}
                    onChange={async (checked) => {
                      const itemDoc = doc(db, "notes", i.id);
                      await updateDoc(itemDoc, {
                        done: checked,
                        doneAt: checked ? Timestamp.now() : "",
                      });
                    }}
                  >
                    {i.done ? "Đã xong" : "Chưa xong"}
                  </Tag.CheckableTag>
                }
                style={{
                  width: "100%",
                }}
              >
                <div
                  style={{
                    backgroundColor: theme.colorBackgroundDiv,
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                >
                  {i.description}
                </div>
                <p style={{ fontSize: 10 }}>Tạo: {formatTime(i?.createAt)}</p>
                {Boolean(i.doneAt) && (
                  <p style={{ fontSize: 10 }}>Xong: {formatTime(i?.doneAt)}</p>
                )}
              </Card>
            );
          })}
          {(notes?.length === 0 || filteredNote?.length === 0) && (
            <div style={{ textAlign: "center" }}>Không có note nào!!</div>
          )}
        </div>

        <Drawer
          title="Bộ lọc"
          closable={false}
          onClose={() => {}}
          open={openFilterPanel}
          extra={
            <Space>
              <Button
                disabled={isDefaultFilterClone}
                type="primary"
                onClick={() =>
                  setParamsFilterClone({
                    level: "all",
                    noteTo: "all",
                    owner: "all",
                    done: "all",
                  })
                }
              >
                Bộ lọc mặc định
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setParamsFilter(paramsFilterClone);
                  setOpenFilterPanel(false);
                }}
              >
                Lọc
              </Button>
              <Button
                onClick={() => {
                  setOpenFilterPanel(false);
                }}
              >
                Huỷ
              </Button>
            </Space>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>Độ ưu tiên</div>
            <div>
              <Select
                defaultValue={paramsFilterClone?.level}
                style={{
                  width: "100%",
                }}
                onChange={(val) =>
                  setParamsFilterClone((pre) => ({
                    ...pre,
                    level: val,
                  }))
                }
                value={paramsFilterClone?.level}
              >
                <Select.Option value="all">Tất cả</Select.Option>
                <Select.Option value="normal">Bình thường</Select.Option>
                <Select.Option value="low">Thấp</Select.Option>
                <Select.Option value="mid">Trung bình</Select.Option>
                <Select.Option value="high">Cao</Select.Option>
              </Select>
            </div>

            <div>Người tạo</div>
            <div>
              <Select
                defaultValue={paramsFilterClone.owner}
                style={{
                  width: "100%",
                }}
                onChange={(val) =>
                  setParamsFilterClone((pre) => ({
                    ...pre,
                    owner: val,
                  }))
                }
                value={paramsFilterClone.owner}
              >
                <Select.Option key="all" value="all">
                  Tất cả
                </Select.Option>
                {usersList?.map((user, index) => {
                  return (
                    <Select.Option key={index} value={user.uid}>
                      {user.email.split("@")[0]}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>

            <div>Dành cho</div>
            <div>
              <Select
                defaultValue={paramsFilterClone.noteTo}
                style={{
                  width: "100%",
                }}
                onChange={(val) =>
                  setParamsFilterClone((pre) => ({
                    ...pre,
                    noteTo: val,
                  }))
                }
                value={paramsFilterClone.noteTo}
              >
                <Select.Option key="all" value="all">
                  Tất cả
                </Select.Option>
                {usersList?.map((user, index) => {
                  return (
                    <Select.Option key={index} value={user.uid}>
                      {user.email.split("@")[0]}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>

            <div>Trạng thái</div>
            <div>
              <Select
                defaultValue={paramsFilterClone.done}
                style={{
                  width: "100%",
                }}
                onChange={(val) =>
                  setParamsFilterClone((pre) => ({
                    ...pre,
                    done: val,
                  }))
                }
                value={paramsFilterClone.done}
              >
                <Select.Option key="all" value="all">
                  Tất cả
                </Select.Option>
                <Select.Option key="true" value={true}>
                  Đã xong
                </Select.Option>
                <Select.Option key="false" value={false}>
                  Chưa xong
                </Select.Option>
              </Select>
            </div>
          </div>
        </Drawer>
        <Drawer
          title="Tạo note"
          closable={false}
          onClose={() => {}}
          open={openChildrenPanel}
          extra={
            <Space>
              <Button type="primary" onClick={() => handleAddNote()}>
                Lưu
              </Button>
              <Button onClick={() => setOpenChildrenPanel(false)}>Huỷ</Button>
            </Space>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <div>Độ ưu tiên</div>
            <div>
              <Select
                defaultValue={level}
                style={{
                  width: "100%",
                }}
                onChange={(val) => setLevel(val)}
                value={level}
              >
                <Select.Option value="normal">Bình thường</Select.Option>
                <Select.Option value="low">Thấp</Select.Option>
                <Select.Option value="mid">Trung bình</Select.Option>
                <Select.Option value="high">Cao</Select.Option>
              </Select>
            </div>

            <div>Dành cho</div>
            <div>
              <Select
                defaultValue={userSelected}
                style={{
                  width: "100%",
                }}
                onChange={(val) => setUserSelected(val)}
                value={userSelected}
              >
                {usersList?.map((user, index) => {
                  return (
                    <Select.Option key={index} value={user.uid}>
                      {user.email.split("@")[0]}
                    </Select.Option>
                  );
                })}
              </Select>
            </div>

            <div>Nội dung</div>
            <div>
              <TextArea
                value={descriptionNote}
                placeholder="Nội dung"
                onChange={(e) => {
                  setDescriptionNote(e.target.value);
                  setErrorMessage("");
                }}
              />
              {errorMessage && (
                <p style={{ color: "red" }}>Nhập cái này nèeee!!!</p>
              )}
            </div>
          </div>
        </Drawer>
      </Drawer>
    </>
  );
}

export default AppAdmin;
