import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

// 使用 React.forwardRef 来包裹 Timer 组件
const Timer = forwardRef((props, ref) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, seconds]);

  // 使用 useImperativeHandle 暴露组件内部的方法给父组件
  useImperativeHandle(ref, () => ({
    startTimer() {
      setIsActive(true);
    },
    stopTimer() {
      setIsActive(false);
    },
    resetTimer() {
      setSeconds(0);
      setIsActive(false);
      clearInterval(intervalRef.current);
    },
    getTime() {
      return seconds;
    },
  }));

  const formatTime = (totalSeconds) => {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="timer flex flex-col items-center">
      <h1 className="text-2xl">Time: {formatTime(seconds)}</h1>
    </div>
  );
});

export default Timer;
