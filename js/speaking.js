// speaking.js - All units common speaking functions

let mediaRecorder;
let audioChunksUrl = {};
let audioChunksBlob = {};
let transcribeSessions = {};


// T/F 버튼 선택 시 시각적 효과
function selectTF(btn, val) {
    const parent = btn.parentElement;
    const btns = parent.querySelectorAll('.tf-btn');
    btns.forEach(b => {
        b.style.background = '#fff';
        b.style.color = '#333';
        b.classList.remove('selected');
    });
    btn.style.background = '#333';
    btn.style.color = '#fff';
    btn.classList.add('selected');
    btn.dataset.value = val;
}

// 정답 확인 및 토글 함수
function validateTF(rowId, correctVal, explanation) {
    const row = document.getElementById(rowId);
    const selectedBtn = row.querySelector('.tf-btn.selected');
    const ansText = row.querySelector('.answer-text');
    // 이미 정답이 보이고 있다면 -> 다시 숨기기 (토글)
    if (ansText.style.display === 'inline') {
        ansText.style.display = 'none';
        row.style.background = '#fff'; // 배경색 초기화
        return;
    }
    // 버튼을 선택하지 않았을 때
    if (!selectedBtn) {
        alert("Please select T or F first!");
        return;
    }
    // 정답 확인 모드
    const userVal = selectedBtn.dataset.value;
    ansText.style.display = 'inline';
    ansText.innerText = explanation;
    if (userVal === correctVal) {
        row.style.background = '#e8f5e9'; // 정답: 연한 초록색
        ansText.style.color = '#2e7d32';
    } else {
        row.style.background = '#ffebee'; // 오답: 연한 빨간색
        ansText.style.color = '#c62828';
    }
}


function toggleAnswer(btn) {
    const answerSpan = btn.nextElementSibling;
    if (answerSpan.style.display === "none" || answerSpan.style.display === "") {
        answerSpan.style.display = "inline";
        btn.innerText = "Hide";
    } else {
        answerSpan.style.display = "none";
        btn.innerText = "Check";
    }
}


function initDialogue() {
    const container = document.getElementById('dialogue-container');
    if (!container || !dialogueData.length) return;
    
    container.innerHTML = '';
    dialogueData.forEach((item, index) => {
        const div = document.createElement('div');
        div.style = `padding: 12px 15px; background: ${item.bg}; border-radius: 12px; border-left: 6px solid ${item.color}; display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;`;
        div.innerHTML = `
            <div style="flex: 1;"><strong style="color: ${item.color};">${item.name}:</strong> <span>${item.text}</span></div>
            <div style="display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap;">
                <button onclick="speakText(\`${item.text.replace(/<\/?[^>]+(>|$)/g, "")}\`, '${item.char}')" style="background: ${item.color}; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">🔊</button> 
                <button id="rec-${index}" onclick="toggleRecord(${index})" style="background: #e74c3c; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer;">🎤</button>
                <button id="play-${index}" onclick="playMyVoice(${index})" style="background: #2ecc71; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: none;">▶</button>
                <button id="download-${index}" onclick="downloadRecording(${index})" style="background: #3498db; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: none;">💾</button>
                <button id="transcribe-${index}" onclick="transcribeRecording(${index})" style="background: #9c27b0; border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: none;" title="Speak & Transcribe">📝</button>
            </div>
        `;
        container.appendChild(div);
    });
}


function speakText(text, character) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = (character === 'maya') ? 1.5 : 1.1;
    window.speechSynthesis.speak(utterance);
}


async function toggleRecord(index) {
    const btn = document.getElementById(`rec-${index}`);
    if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        btn.style.backgroundColor = "#e74c3c";
        btn.innerText = "🎤";
    } else {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: false,
                channelCount: 1
            } 
        });
        
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 2.0;
        const destination = audioContext.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(destination);
        
        mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];
        mediaRecorder.ondataavailable = e => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            
            if (audioChunksUrl[index]) {
                URL.revokeObjectURL(audioChunksUrl[index]);
            }
            
            audioChunksUrl[index] = url;
            audioChunksBlob[index] = blob;
            
            const playBtn = document.getElementById(`play-${index}`);
            if (playBtn) playBtn.style.display = "flex";
            
            const downloadBtn = document.getElementById(`download-${index}`);
            if (downloadBtn) downloadBtn.style.display = "flex";
            
            const transcribeBtn = document.getElementById(`transcribe-${index}`);
            if (transcribeBtn) transcribeBtn.style.display = "flex";
            
            stream.getTracks().forEach(track => track.stop());
            audioContext.close();
        };
        mediaRecorder.start();
        btn.style.backgroundColor = "#000";
        btn.innerText = "⏹";
    }
}


function playMyVoice(index) {
    if (audioChunksUrl[index]) {
        new Audio(audioChunksUrl[index]).play();
    } else {
        alert("Please record first.");
    }
}


function downloadRecording(index) {
    if (audioChunksBlob[index]) {
        const blob = audioChunksBlob[index];
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `speaking_${index+1}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        alert("No recording to download.");
    }
}


// ========== 음성 전사(STT) 기능 ==========

function transcribeRecording(index) {
    // 이미 결과가 있다면 제거 (토글 기능)
    const existingResult = document.getElementById(`transcript-result-${index}`);
    if (existingResult) {
        existingResult.remove();
        return;
    }
    
    // 브라우저 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
        return;
    }
    
    const transcribeBtn = document.getElementById(`transcribe-${index}`);
    if (!transcribeBtn) {
        alert("Please record first.");
        return;
    }
    
    const originalText = transcribeBtn.innerText;
    transcribeBtn.innerText = "🎙️";
    transcribeBtn.style.backgroundColor = "#e91e63";

    // 이전 세션이 남아있다면 정리
    stopTranscribeSession(index);
    
    // 음성 인식 객체 생성
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let recognizedText = "";
    let didRecognitionStart = false;
    
    // 인식 결과 처리
    recognition.onresult = (event) => {
        recognizedText = event.results[0][0].transcript;
    };
    
    recognition.onerror = (event) => {
        console.error("Recognition error:", event.error);
        if (event.error === "no-speech") {
            alert("No speech detected. Please speak into the microphone and try again.");
        } else if (event.error === "not-allowed") {
            alert("Microphone access denied. Please allow microphone access.");
        } else {
            alert(`Recognition error: ${event.error}`);
        }
        transcribeBtn.innerText = originalText;
        transcribeBtn.style.backgroundColor = "#9c27b0";
        stopTranscribeSession(index);
    };
    
    recognition.onend = () => {
        transcribeBtn.innerText = originalText;
        transcribeBtn.style.backgroundColor = "#9c27b0";
        finalizeTranscribeSession(index, recognizedText);
    };

    // STT + 녹음 동시 시작
    navigator.mediaDevices.getUserMedia({
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: false,
            channelCount: 1
        }
    }).then((stream) => {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
            if (!chunks.length) return;
            const blob = new Blob(chunks, { type: "audio/webm" });
            if (audioChunksUrl[index]) {
                URL.revokeObjectURL(audioChunksUrl[index]);
            }
            audioChunksBlob[index] = blob;
            audioChunksUrl[index] = URL.createObjectURL(blob);
            const playBtn = document.getElementById(`play-${index}`);
            if (playBtn) playBtn.style.display = "flex";
            const downloadBtn = document.getElementById(`download-${index}`);
            if (downloadBtn) downloadBtn.style.display = "flex";
        };

        transcribeSessions[index] = { stream, recorder, recognition };
        recorder.start();
        recognition.start();
        didRecognitionStart = true;
    }).catch(() => {
        alert("Microphone access denied. Please allow microphone access.");
        transcribeBtn.innerText = originalText;
        transcribeBtn.style.backgroundColor = "#9c27b0";
    });
    
    // 상태 메시지 표시 (해당 row 아래에)
    const statusMsg = document.createElement('div');
    statusMsg.id = `transcribe-status-${index}`;
    statusMsg.style.cssText = `
        margin-top: 8px;
        margin-bottom: 5px;
        padding: 6px 12px;
        background: #fce4ec;
        border-radius: 8px;
        font-size: 12px;
        color: #c2185b;
        text-align: center;
    `;
    statusMsg.innerText = "🎤 Listening... Please speak now";
    
    // rec 버튼을 기준으로 해당 row 찾기
    const recBtn = document.getElementById(`rec-${index}`);
    const targetRow = recBtn ? recBtn.closest('#dialogue-container > div') : null;
    if (targetRow) {
        targetRow.after(statusMsg);
    }

    // recognition.start()가 호출되지 못한 경우를 위한 안전장치
    setTimeout(() => {
        if (!didRecognitionStart) {
            const status = document.getElementById(`transcribe-status-${index}`);
            if (status) status.remove();
        }
    }, 2000);
}


function stopTranscribeSession(index) {
    const session = transcribeSessions[index];
    if (!session) return;

    if (session.recorder && session.recorder.state !== "inactive") {
        session.recorder.stop();
    }
    if (session.stream) {
        session.stream.getTracks().forEach((track) => track.stop());
    }
    delete transcribeSessions[index];
}


function finalizeTranscribeSession(index, recognizedText) {
    // 상태 메시지 제거
    const statusMsg = document.getElementById(`transcribe-status-${index}`);
    if (statusMsg) statusMsg.remove();

    stopTranscribeSession(index);

    if (recognizedText) {
        showTranscriptionResult(index, recognizedText);
    }
}


function showTranscriptionResult(index, text) {
    // 상태 메시지 제거
    const statusMsg = document.getElementById(`transcribe-status-${index}`);
    if (statusMsg) statusMsg.remove();
    
    // 기존 결과 제거
    const existingResult = document.getElementById(`transcript-result-${index}`);
    if (existingResult) existingResult.remove();
    
    // rec 버튼을 기준으로 해당 row 찾기
    const recBtn = document.getElementById(`rec-${index}`);
    const targetRow = recBtn ? recBtn.closest('#dialogue-container > div') : null;
    if (!targetRow) return;
    
    const resultDiv = document.createElement('div');
    resultDiv.id = `transcript-result-${index}`;
    resultDiv.style.cssText = `
        margin-top: 10px;
        margin-bottom: 5px;
        padding: 10px 14px;
        background: #f3e5f5;
        border-left: 4px solid #9c27b0;
        border-radius: 10px;
        font-size: 14px;
        color: #4a148c;
        word-break: break-all;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 10px;
    `;
    resultDiv.innerHTML = `
        <span><strong>📝 Transcription:</strong> "${text}"</span>
        <div style="display: flex; gap: 8px;">
            <button onclick="copyTranscription(${index})" style="background: #e1bee7; border: none; border-radius: 6px; padding: 5px 12px; color: #4a148c; cursor: pointer; font-size: 12px;">📋 Copy</button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 16px;">✖</button>
        </div>
    `;
    
    targetRow.after(resultDiv);
}


function copyTranscription(index) {
    const resultDiv = document.getElementById(`transcript-result-${index}`);
    if (resultDiv) {
        const textMatch = resultDiv.innerText.match(/"([^"]*)"/);
        const text = textMatch ? textMatch[1] : "";
        
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                const copyBtn = resultDiv.querySelector('button');
                const originalText = copyBtn.innerText;
                copyBtn.innerText = "✓ Copied!";
                setTimeout(() => {
                    copyBtn.innerText = originalText;
                }, 1500);
            }).catch(() => {
                alert("Failed to copy.");
            });
        }
    }
}
