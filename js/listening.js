// listening.js - 모든 유닛에서 공통으로 사용하는 Listening 스크립트 동기화 기능


        function setupAudioSync(audioId, containerId, data, isDialogue = false) {
    const audio = document.getElementById(audioId);
    const container = document.getElementById(containerId);
    if(!audio || !container) return;
    
    container.innerHTML = '';
    data.forEach((line, index) => {
        const div = document.createElement('div');
        div.className = 'script-line';
        div.id = `${containerId}-line-${index}`;
        div.innerHTML = isDialogue ? `<strong>${line.speaker}:</strong> ${line.text}` : line.text;
        container.appendChild(div);
    });
    // 오디오 재생 시 스크립트 창 보이기
    audio.addEventListener('play', () => { 
        container.style.display = 'block'; 
    });
    // 오디오 진행 시간에 맞춰 스크립트 하이라이트 및 스크롤
    audio.addEventListener('timeupdate', () => {
        let activeIdx = -1;
        for (let i = 0; i < data.length; i++) {
            if (audio.currentTime >= data[i].start) activeIdx = i; else break;
        }
        container.querySelectorAll('.script-line').forEach(l => l.classList.remove('active'));
        if (activeIdx !== -1) {
            const currentLine = document.getElementById(`${containerId}-line-${activeIdx}`);
            if (currentLine) {
                currentLine.classList.add('active');
                container.scrollTo({ 
                    top: currentLine.offsetTop - container.offsetTop - 80, 
                    behavior: 'smooth' 
                });
            }
        }
    });
    // 추가된 부분: 음성 재생이 끝나면 스크립트 창 숨기기
    audio.addEventListener('ended', () => { 
        container.style.display = 'none'; 
    });
}        function centralizeScroll(targetId) {
            const element = document.getElementById(targetId);
            if (!element) return;
            const elementRect = element.getBoundingClientRect();
            const middle = (elementRect.top + window.pageYOffset) - (window.innerHeight / 2) + (elementRect.height / 2);
            window.scrollTo({ top: middle, behavior: 'smooth' });
            if (targetId.startsWith('vocab')) {
                document.querySelectorAll('.card').forEach(c => c.classList.remove('active-highlight'));
                element.classList.add('active-highlight');
                setTimeout(() => element.classList.remove('active-highlight'), 1500);
            }
        }
        
// Vocabulary 스크롤 함수 (공통)
function centralizeScroll(targetId) {
    const element = document.getElementById(targetId);
    if (!element) return;
    
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    if (targetId.startsWith('vocab')) {
        document.querySelectorAll('.card').forEach(c => c.classList.remove('active-highlight'));
        element.classList.add('active-highlight');
        setTimeout(() => element.classList.remove('active-highlight'), 1500);
    }
}
