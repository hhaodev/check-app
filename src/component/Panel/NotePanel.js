import { LoadingOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Drawer,
  Input,
  message,
  Select,
  Space,
  Spin,
  Tag,
} from "antd";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import { useAppContext, useCustomTheme } from "../../context/AppContext";
import { db } from "../../firebaseConfig";
import { filterNotes, formatTime } from "../../ultis";

const NotePanel = ({ open, onClosePanel, notes }) => {
  const theme = useCustomTheme();
  const { userState } = useAppContext();
  const { TextArea } = Input;

  const [openAddNotePanel, setOpenAddNotePanel] = useState(false);
  const [openFilterPanel, setOpenFilterPanel] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [level, setLevel] = useState("normal");
  const [userSelected, setUserSelected] = useState("");
  const [descriptionNote, setDescriptionNote] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  const [addButtonLoading, setAddButtonLoading] = useState(false);
  const [panelLoading, setPanelLoading] = useState(false);

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

  const filteredNote = useMemo(() => {
    return filterNotes(notes, paramsFilter);
  }, [paramsFilter, notes]);

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

  const isSameFilter = useMemo(() => {
    return Object.keys(paramsFilter).every(
      (key) => paramsFilter[key] === paramsFilterClone[key]
    );
  }, [paramsFilterClone, paramsFilter]);

  useEffect(() => {
    if (open) {
      getOptionsAddNote();
    } else {
      setUsersList([]);
      setUserSelected("");
    }
  }, [open, openAddNotePanel]);

  useEffect(() => {
    if (open) {
      setParamsFilter((pre) => ({
        ...pre,
        noteTo: userState.user.uid,
        done: false,
      }));
    }
  }, [open]);

  useEffect(() => {
    if (openFilterPanel) {
      setParamsFilterClone(paramsFilter);
    }
  }, [openFilterPanel]);

  const getOptionsAddNote = async () => {
    setPanelLoading(true);
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
    } finally {
      setPanelLoading(false);
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
        {tags.map((i, index) => (
          <div key={index} style={{ margin: "5px 0px" }}>
            {i}
          </div>
        ))}
      </div>
    );
  };

  const renderTitle = (level, owner, noteTo) => {
    let lev;
    switch (level) {
      case "low":
        lev = <Tag color="lime">Thấp</Tag>;
        break;
      case "mid":
        lev = <Tag color="orange">Trung bình</Tag>;
        break;
      case "high":
        lev = <Tag color="red">Cao</Tag>;
        break;
      case "normal":
        lev = <Tag color="blue">Bình thường</Tag>;
        break;
      default:
        lev = <Tag color="blue">Bình thường</Tag>;
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
    setAddButtonLoading(true);
    if (!descriptionNote) {
      setErrorMessage(true);
      setAddButtonLoading(false);
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
      setOpenAddNotePanel(false);
    } catch (error) {
      console.error("Error adding document: ", error);
    } finally {
      setAddButtonLoading(false);
    }
  };

  return (
    <Drawer
      title="NoteBook"
      onClose={onClosePanel}
      open={open}
      closable={false}
      extra={
        <Space>
          <Button type="primary" onClick={() => setOpenFilterPanel(true)}>
            Bộ lọc
          </Button>
          <Button type="primary" onClick={() => setOpenAddNotePanel(true)}>
            Tạo note
          </Button>
          <Button onClick={onClosePanel}>X</Button>
        </Space>
      }
    >
      {panelLoading && (
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
      {!panelLoading && (
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
      )}

      <Drawer
        title="Bộ lọc"
        closable={false}
        onClose={() => setOpenFilterPanel(false)}
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
              disabled={isSameFilter}
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
        onClose={() => setOpenAddNotePanel(false)}
        open={openAddNotePanel}
        extra={
          <Space>
            <Button
              loading={addButtonLoading}
              type="primary"
              onClick={() => handleAddNote()}
            >
              Lưu
            </Button>
            <Button onClick={() => setOpenAddNotePanel(false)}>Huỷ</Button>
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
  );
};

export default NotePanel;
