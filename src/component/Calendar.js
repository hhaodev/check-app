import { LoadingOutlined } from "@ant-design/icons";
import { Button, Modal, Popover, Spin } from "antd";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { formatDate, formatTime } from "../ultis";

const CalendarHistoryCheck = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkedDates, setCheckedDates] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCheckedDates = async () => {
    const checkedDates = {};
    const historyChecksCollection = collection(db, "historyCheck");
    const snapshot = await getDocs(historyChecksCollection);

    snapshot.forEach((snapshotCheck) => {
      const docId = snapshotCheck.id;
      const data = snapshotCheck.data();

      if (data) {
        checkedDates[docId] = { isChecked: data.isChecked, time: data.time };
      }
    });

    return checkedDates;
  };

  useEffect(() => {
    if (isOpen) {
      (async () => {
        const checkedDatesObj = await fetchCheckedDates();
        setCheckedDates(checkedDatesObj);
        setLoading(false);
      })();
    } else {
      setCheckedDates({});
      setLoading(true);
    }
  }, [isOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = Array.from(
    { length: lastDayOfMonth.getDate() },
    (_, i) => new Date(year, month, i + 1)
  );

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  };

  return (
    <Modal
      style={{ top: "25%" }}
      open={isOpen}
      footer={null}
      title={<div style={{ textAlign: "center" }}>{`Lịch sử uống thuốc`}</div>}
      onCancel={onClose}
    >
      <>
        {loading && (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 330,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spin
              indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}
            />
          </div>
        )}
        {!loading && (
          <div className="calendar">
            <div className="header-cld">
              <Button className="btn-change-cld" onClick={handlePreviousMonth}>
                &lt;
              </Button>
              <div className="title-cld">
                {currentDate.toLocaleString("default", { month: "long" })}{" "}
                {year}
              </div>
              <Button className="btn-change-cld" onClick={handleNextMonth}>
                &gt;
              </Button>
            </div>
            <div className="days-grid">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date(currentDate);
                date.setDate(date.getDate() - date.getDay() + i);

                return (
                  <div
                    key={date.toLocaleDateString("default", {
                      weekday: "short",
                    })}
                    className="day-name"
                  >
                    {date.toLocaleDateString("default", {
                      weekday: "short",
                    })}
                  </div>
                );
              })}
              {Array(firstDayOfMonth.getDay())
                .fill(null)
                .map((_, i) => (
                  <div key={`empty-${i}`} className="day empty" />
                ))}
              {daysInMonth.map((date) => {
                const formattedDate = formatDate(date); // yyyy-mm-dd
                const data = checkedDates[formattedDate];
                const pastDate = isPastDate(date);

                return (
                  <Popover
                    content={
                      <>
                        {!pastDate
                          ? `Chưa đến ngày uống thuốc`
                          : data?.isChecked
                          ? `Em uống lúc ${formatTime(data?.time, true)}`
                          : `Ngày này em chưa uống thuốc`}
                      </>
                    }
                    trigger="click"
                    key={formattedDate}
                  >
                    <div
                      key={formattedDate}
                      className={`day ${
                        data?.isChecked ? "checked" : "not-check"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                  </Popover>
                );
              })}
            </div>
          </div>
        )}
      </>
    </Modal>
  );
};

export default CalendarHistoryCheck;