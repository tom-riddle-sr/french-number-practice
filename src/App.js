import React, { useState, useEffect, useRef } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

function App() {
  const [number, setNumber] = useState(null);
  const [voices, setVoices] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [history, setHistory] = useState([]); // 記錄數字的歷史
  const [currentNumber, setCurrentNumber] = useState(null); // 當前數字
  const [minRange, setMinRange] = useState(0); // 最小範圍
  const [maxRange, setMaxRange] = useState(100); // 最大範圍
  const { speak, cancel } = useSpeechSynthesis();
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const generateButtonRef = useRef(null);

  useEffect(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);

    if (autoGenerate) {
      // 自動生成數字每5秒
      const interval = setInterval(() => {
        generateAndSpeakNumber();
      }, 5000);

      return () => clearInterval(interval); // 清除定時器
    }
  }, [voices, speed, autoGenerate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault(); // 防止空白鍵滾動頁面
        generateButtonRef.current.click(); // 觸發“Generate Number Now”按鈕的點擊事件
      } else if (e.code === 'Slash') { // 檢測 / 鍵
        e.preventDefault(); // 防止默認行為
        inputRef.current.focus(); // 將焦點移到輸入框
      } else if (e.code === 'ArrowLeft') { // 檢測左箭頭鍵
        setSpeed((prevSpeed) => Math.max(prevSpeed - 0.1, 0.5));
      } else if (e.code === 'ArrowRight') { // 檢測右箭頭鍵
        setSpeed((prevSpeed) => Math.min(prevSpeed + 0.1, 2));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const generateAndSpeakNumber = () => {
    const randomNumber = Math.floor(Math.random() * (maxRange - minRange + 1)) + minRange;
    setCurrentNumber(randomNumber); // 設置當前數字
    setNumber(null); // 隱藏數字

    const frenchVoice = voices.find((voice) => voice.lang === 'fr-FR');

    if (frenchVoice) {
      cancel(); // 取消當前的發音任務
      speak({
        text: randomNumber.toString(),
        voice: frenchVoice,
        rate: speed,
      });

      // 設定計時器，5秒後自動停止
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setMessage('Time is up!');
        setAutoGenerate(false);
        speak({
          text: 'Time is up!',
          voice: frenchVoice,
          rate: speed,
        });
        // 記錄未回答的數字
        setHistory((prevHistory) => [
          ...prevHistory,
          { number: randomNumber, correct: false, timedOut: true }
        ]);
      }, 5000);
    } else {
      alert('French voice not found');
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleMinRangeChange = (e) => {
    setMinRange(parseInt(e.target.value, 10));
  };

  const handleMaxRangeChange = (e) => {
    setMaxRange(parseInt(e.target.value, 10));
  };

  const checkAnswer = () => {
    const frenchVoice = voices.find((voice) => voice.lang === 'fr-FR');

    if (parseInt(inputValue, 10) === currentNumber) {
      setMessage('Correct!');
      if (frenchVoice) {
        speak({
          text: 'Correct',
          voice: frenchVoice,
          rate: speed,
        });
      }
      clearTimeout(timerRef.current); // 清除計時器
      setInputValue(''); // 清除輸入框
      setNumber(currentNumber); // 顯示正確的數字
      setHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.number === currentNumber ? { ...entry, correct: true, timedOut: false } : entry
        )
      );
      generateAndSpeakNumber(); // 生成下一題
    } else {
      setMessage(`Incorrect, the correct number was ${currentNumber}.`);
      if (frenchVoice) {
        speak({
          text: 'Incorrect',
          voice: frenchVoice,
          rate: speed,
        });
      }
      setAutoGenerate(false); // 停止自動播放
      setNumber(currentNumber); // 顯示錯誤的數字
      setHistory((prevHistory) =>
        prevHistory.map((entry) =>
          entry.number === currentNumber ? { ...entry, correct: false, timedOut: false } : entry
        )
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // 防止表單默認提交
    checkAnswer(); // 調用檢查答案函數
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Practice French Numbers</h1>

      <div>
        <label>Min Range: </label>
        <input
          type="number"
          value={minRange}
          onChange={handleMinRangeChange}
        />
      </div>
      <div>
        <label>Max Range: </label>
        <input
          type="number"
          value={maxRange}
          onChange={handleMaxRangeChange}
        />
      </div>

      <p style={{ fontSize: '2em' }}>{number !== null ? number : ''}</p>

      <div>
        <label>Speed: </label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(e.target.value)}
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Enter the number"
            ref={inputRef} // 設置輸入框的引用
          />
          <button type="submit">Check</button>
        </div>
      </form>

      <p>{message}</p>

      <button
        ref={generateButtonRef}
        onClick={() => {
          setAutoGenerate(true); // 開啟自動生成
          generateAndSpeakNumber(); // 立即生成數字
        }}
        style={{ padding: '10px 20px', fontSize: '16px' }}
      >
        Generate Number Now
      </button>

      <div style={{ marginTop: '20px' }}>
        <h2>History</h2>
        <ul>
          {history.map((entry, index) => (
            <li
              key={index}
              style={{
                color: entry.correct === false || entry.timedOut ? 'red' : 'black',
                textDecoration: entry.timedOut ? 'line-through' : 'none'
              }}
            >
              #{index + 1}: {entry.number}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
