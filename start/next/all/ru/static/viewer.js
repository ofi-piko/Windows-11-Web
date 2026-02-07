async function loadItems(){
  try{
    const res = await fetch('./viewer_content.json');
    const items = await res.json();
    const list = document.getElementById('list');
    items.forEach(it => {
      const el = document.createElement('div'); el.className='item';
      const thumb = document.createElement('div');
      if(it.type==='image'){
        const img = document.createElement('img'); img.src = it.url; thumb.appendChild(img);
      } else {
        const txt = document.createElement('div'); txt.style.width='64px'; txt.style.height='64px'; txt.style.display='grid'; txt.style.placeItems='center'; txt.textContent='TXT'; thumb.appendChild(txt);
      }
      const meta = document.createElement('div'); meta.className='meta';
      const title = document.createElement('div'); title.textContent = it.title; title.style.fontWeight='600';
      const sub = document.createElement('div'); sub.style.opacity='0.8'; sub.style.fontSize='13px'; sub.textContent = it.type+' • ID: '+it.id;
      meta.appendChild(title); meta.appendChild(sub);
      const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Open'; btn.onclick = ()=>openViewer(it);
      el.appendChild(thumb); el.appendChild(meta); el.appendChild(btn);
      list.appendChild(el);
    })
  }catch(e){console.error('failed load',e); document.getElementById('list').textContent='Failed to load content.'}
}

const viewer = document.getElementById('viewer');
const viewerBody = document.getElementById('viewerBody');
const saveBtn = document.getElementById('saveBtn');
const closeBtn = document.getElementById('closeBtn');
const saveNote = document.getElementById('saveNote');
let currentItem = null;

function openViewer(item){
  currentItem = item;
  viewerBody.innerHTML='';
  saveNote.textContent='';
  if(item.type==='image'){
    const img = document.createElement('img'); img.src = item.url; viewerBody.appendChild(img);
  } else {
    const ta = document.createElement('textarea'); ta.id='editorTA'; ta.value = item.content || ''; viewerBody.appendChild(ta);
  }
  viewer.style.display='flex';
}

function closeViewer(){ viewer.style.display='none'; currentItem=null }

closeBtn.addEventListener('click', ()=>{ closeViewer(); });

saveBtn.addEventListener('click', ()=>{
  if(!currentItem) return;
  const ts = new Date().toISOString();
  if(currentItem.type==='image'){
    fetch(currentItem.url).then(r=>r.blob()).then(blob=>{
      const suggested = (currentItem.title||'image') + '.jpg';
      triggerDownload(blob, suggested);
      saveMeta(currentItem.id, suggested, 'download');
      saveNote.textContent = `Saved as download: ${suggested} — browser will ask where to put it.`;
    }).catch(e=>{saveNote.textContent='Failed to fetch image.'})
  } else {
    const ta = document.getElementById('editorTA');
    const text = ta.value;
    const blob = new Blob([text], {type:'text/plain'});
    const suggested = (currentItem.title||'text') + '.txt';
    triggerDownload(blob, suggested);
    saveMeta(currentItem.id, suggested, 'download');
    saveNote.textContent = `Saved as download: ${suggested} — browser will ask where to put it.`;
    localStorage.setItem('viewer_local_'+currentItem.id, JSON.stringify({id:currentItem.id, title:currentItem.title, content:text, savedAt:ts}));
  }
});

function triggerDownload(blob, filename){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

function saveMeta(id, filename, method){
  const key = 'viewer_saved_'+id;
  const data = {id, filename, method, savedAt:new Date().toISOString(), note:'Saved via browser download — actual OS path determined by user'};
  localStorage.setItem(key, JSON.stringify(data));
}

loadItems();
