(() => {
  'use strict';
  const papers = { Carta:[21.59,27.94], Oficio:[21.59,35.56], 'Doble Carta':[27.94,43.18] };
  const $ = id => document.getElementById(id);
  const el = { files:$('image-files'), name:$('file-name'), outputName:$('output-name'), next:$('next-image'), queue:$('queue-label'), paper:$('paper'), orientation:$('orientation'), width:$('width'), height:$('height'), ratio:$('keep-ratio'), crop:$('crop-toggle'), cropActions:$('crop-actions'), applyCrop:$('apply-crop'), cancelCrop:$('cancel-crop'), count:$('page-count'), all:$('select-all'), none:$('select-none'), save:$('save-pdf'), status:$('status'), grid:$('grid-label'), canvas:$('preview'), wrap:$('preview-wrap'), empty:$('empty-state') };
  const ctx = el.canvas.getContext('2d');
  let queue = [], image = null, imageName = '', rows = 0, cols = 0, selected = new Set(), ratio = 1, syncing = false, cropMode = false, cropStart = null, cropRect = null, viewRect = null, imageViewRect = null, resizeTimer;

  function cm(value){ return Math.max(1,Math.round(value*96/2.54)); }
  function num(input){ const n=parseFloat(input.value.replace(',','.')); return Number.isFinite(n)&&n>0?n:null; }
  function size(){ return [num(el.width),num(el.height)]; }
  function dims(orient=el.orientation.value){ let [w,h]=papers[el.paper.value]; return orient==='Horizontal'?[h,w]:[w,h]; }
  function cellKey(r,c){ return `${r},${c}`; }
  function recalc(reset=true){
    const [w,h]=size(); if(!w||!h){rows=cols=0;draw();return;}
    const [pw,ph]=dims(); rows=Math.ceil(h/ph); cols=Math.ceil(w/pw);
    if(reset){selected=new Set();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)selected.add(cellKey(r,c));}
    else selected=new Set([...selected].filter(k=>{const [r,c]=k.split(',').map(Number);return r<rows&&c<cols;}));
    labels();draw();
  }
  function labels(){const total=rows*cols;el.count.textContent=`Páginas: ${selected.size} / ${total}`;el.grid.textContent=`Filas: ${rows} · Columnas: ${cols}`;el.all.disabled=!image;el.none.disabled=!image;el.save.disabled=!image||selected.size===0;}
  function autoOrientation(){const [w,h]=size();if(!w||!h)return;const cost=o=>{const [pw,ph]=dims(o);return Math.ceil(h/ph)*Math.ceil(w/pw);};el.orientation.value=cost('Vertical')<=cost('Horizontal')?'Vertical':'Horizontal';recalc(true);}
  function loadNext(){if(!queue.length){el.status.textContent='No hay más imágenes en la cola.';return;}const file=queue.shift();const url=URL.createObjectURL(file);const next=new Image();next.onload=()=>{if(image?.src?.startsWith('blob:'))URL.revokeObjectURL(image.src);image=next;imageName=file.name;ratio=image.naturalWidth/image.naturalHeight;el.name.textContent=file.name;el.queue.textContent=queue.length?`${queue.length} imagen${queue.length===1?'':'es'} en cola`:'';el.width.value=(image.naturalWidth*2.54/96).toFixed(2);el.height.value=(image.naturalHeight*2.54/96).toFixed(2);el.crop.disabled=false;el.next.disabled=queue.length===0;el.empty.hidden=true;el.status.textContent='Imagen lista. Toca las hojas que quieras excluir.';autoOrientation();};next.onerror=()=>{URL.revokeObjectURL(url);el.status.textContent=`No se pudo abrir ${file.name}.`;loadNext();};next.src=url;}
  function prepareImage(source,maxSide=0){const sw=source.naturalWidth||source.width,sh=source.naturalHeight||source.height,factor=maxSide?Math.min(1,maxSide/Math.max(sw,sh)):1;const out=document.createElement('canvas');out.width=Math.max(1,Math.round(sw*factor));out.height=Math.max(1,Math.round(sh*factor));out.getContext('2d').drawImage(source,0,0,out.width,out.height);return out;}
  function draw(){const box=el.wrap.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);const W=Math.max(1,box.width),H=Math.max(1,box.height);el.canvas.width=Math.round(W*dpr);el.canvas.height=Math.round(H*dpr);el.canvas.style.width=`${W}px`;el.canvas.style.height=`${H}px`;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);if(!image){el.empty.hidden=false;labels();return;}el.empty.hidden=true;const [printW,printH]=size();if(!printW||!printH||!rows||!cols)return;const [paperW,paperH]=dims();const areaW=Math.min(W-28,1120),areaH=Math.min(H-28,820);const scale=Math.min(areaW/(cols*paperW),areaH/(rows*paperH));const totalW=cols*paperW*scale,totalH=rows*paperH*scale,x0=(W-totalW)/2,y0=(H-totalH)/2;viewRect={x:x0,y:y0,w:totalW,h:totalH};ctx.fillStyle='#fff';ctx.fillRect(x0,y0,totalW,totalH);const iw=printW*scale,ih=printH*scale;const px=x0+(totalW-iw)/2,py=y0+(totalH-ih)/2;imageViewRect={x:px,y:py,w:iw,h:ih};const source=prepareImage(image,1600);ctx.drawImage(source,px,py,iw,ih);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=x0+c*paperW*scale,y=y0+r*paperH*scale,w=paperW*scale,h=paperH*scale;ctx.strokeStyle='#1769e0';ctx.lineWidth=1.5;ctx.strokeRect(x,y,w,h);if(!selected.has(cellKey(r,c))){ctx.fillStyle='rgba(255,255,255,.68)';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#d54854';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+5,y+5);ctx.lineTo(x+w-5,y+h-5);ctx.moveTo(x+w-5,y+5);ctx.lineTo(x+5,y+h-5);ctx.stroke();}}if(cropRect){ctx.strokeStyle='#e14455';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(cropRect.x,cropRect.y,cropRect.w,cropRect.h);ctx.setLineDash([]);}labels();}
  function point(e){const r=el.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  el.canvas.addEventListener('pointerdown',e=>{if(!image||!viewRect)return;el.canvas.setPointerCapture(e.pointerId);const p=point(e);if(cropMode){if(!imageViewRect||p.x<imageViewRect.x||p.y<imageViewRect.y||p.x>imageViewRect.x+imageViewRect.w||p.y>imageViewRect.y+imageViewRect.h)return;cropStart=p;cropRect={x:p.x,y:p.y,w:0,h:0};draw();return;}if(p.x<viewRect.x||p.y<viewRect.y||p.x>viewRect.x+viewRect.w||p.y>viewRect.y+viewRect.h)return;const c=Math.min(cols-1,Math.floor((p.x-viewRect.x)/(viewRect.w/cols))),r=Math.min(rows-1,Math.floor((p.y-viewRect.y)/(viewRect.h/rows))),k=cellKey(r,c);selected.has(k)?selected.delete(k):selected.add(k);draw();});
  el.canvas.addEventListener('pointermove',e=>{if(!cropMode||!cropStart)return;const p=point(e);cropRect={x:Math.min(p.x,cropStart.x),y:Math.min(p.y,cropStart.y),w:Math.abs(p.x-cropStart.x),h:Math.abs(p.y-cropStart.y)};draw();});
  el.canvas.addEventListener('pointerup',()=>{if(cropMode)cropStart=null;});
  function setCrop(on){cropMode=on;cropStart=null;if(!on)cropRect=null;el.cropActions.hidden=!on;el.crop.hidden=on;el.canvas.style.cursor=on?'crosshair':'default';draw();}
  el.files.addEventListener('change',()=>{const files=[...el.files.files].filter(f=>f.type.startsWith('image/'));if(!files.length)return;queue.push(...files);el.next.disabled=false;if(!image)loadNext();else{el.queue.textContent=`${queue.length} imagen${queue.length===1?'':'es'} en cola`;el.status.textContent='Imágenes añadidas a la cola.';}el.files.value='';});
  el.next.addEventListener('click',loadNext);el.paper.addEventListener('change',autoOrientation);el.orientation.addEventListener('change',()=>recalc(true));
  function changeDimension(which){if(syncing||!image)return;const n=num(el[which]);if(!n)return;if(el.ratio.checked){syncing=true;if(which==='width')el.height.value=(n/ratio).toFixed(2);else el.width.value=(n*ratio).toFixed(2);syncing=false;}autoOrientation();}
  el.width.addEventListener('input',()=>changeDimension('width'));el.height.addEventListener('input',()=>changeDimension('height'));el.ratio.addEventListener('change',()=>{if(el.ratio.checked&&image){syncing=true;el.height.value=(num(el.width)||0)/ratio;syncing=false;autoOrientation();}});
  el.all.addEventListener('click',()=>{selected=new Set();for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)selected.add(cellKey(r,c));draw();});el.none.addEventListener('click',()=>{selected.clear();draw();});
  el.crop.addEventListener('click',()=>setCrop(true));el.cancelCrop.addEventListener('click',()=>setCrop(false));el.applyCrop.addEventListener('click',()=>{if(!cropRect||cropRect.w<5||cropRect.h<5||!imageViewRect){el.status.textContent='Dibuja un área de recorte primero.';return;}const x0=Math.max(cropRect.x,imageViewRect.x),y0=Math.max(cropRect.y,imageViewRect.y),x1=Math.min(cropRect.x+cropRect.w,imageViewRect.x+imageViewRect.w),y1=Math.min(cropRect.y+cropRect.h,imageViewRect.y+imageViewRect.h);if(x1-x0<5||y1-y0<5){el.status.textContent='El recorte es demasiado pequeño.';return;}const sx=image.naturalWidth/imageViewRect.w,sy=image.naturalHeight/imageViewRect.h,cropX=(x0-imageViewRect.x)*sx,cropY=(y0-imageViewRect.y)*sy,sw=(x1-x0)*sx,sh=(y1-y0)*sy;const temp=document.createElement('canvas');temp.width=Math.max(1,Math.round(sw));temp.height=Math.max(1,Math.round(sh));temp.getContext('2d').drawImage(image,cropX,cropY,sw,sh,0,0,temp.width,temp.height);const next=new Image();next.onload=()=>{image=next;ratio=image.naturalWidth/image.naturalHeight;syncing=true;el.width.value=(image.naturalWidth*2.54/96).toFixed(2);el.height.value=(image.naturalHeight*2.54/96).toFixed(2);syncing=false;setCrop(false);el.status.textContent='Recorte aplicado.';autoOrientation();};next.src=temp.toDataURL('image/png');});
  function pdfFilename(){
    const entered=el.outputName.value.trim();
    if(!entered&&!window.confirm('No escribiste un nombre para el PDF. Se usará el nombre de la imagen. ¿Quieres continuar?'))return null;
    const base=(entered||imageName.replace(/\.[^.]+$/,'')+'_MKIX').replace(/\.pdf$/i,'').replace(/[<>:"|?*]/g,'_').replaceAll('/','_').replaceAll(String.fromCharCode(92),'_').trim().replace(/[. ]+$/,'');
    return `${base||'imagen'}.pdf`;
  }
  el.save.addEventListener('click',async()=>{
    if(!image||!selected.size)return;
    const filename=pdfFilename();if(!filename)return;
    if(!window.jspdf?.jsPDF){el.status.textContent='No se pudo cargar el exportador PDF. Comprueba tu conexión y recarga la página.';return;}
    el.save.disabled=true;el.status.textContent='Preparando PDF…';
    try{
      const {jsPDF}=window.jspdf;const [w,h]=size(),[pw,ph]=dims();
      const pdf=new jsPDF({orientation:el.orientation.value==='Horizontal'?'landscape':'portrait',unit:'cm',format:[pw,ph],compress:true});
      const source=image;const printW=cm(w),printH=cm(h),pageW=cm(pw),pageH=cm(ph),left=(cols*pageW-printW)/2,top=(rows*pageH-printH)/2;
      let first=true,progress=0;
      for(let r=0;r<rows;r++)for(let col=0;col<cols;col++){
        if(!selected.has(cellKey(r,col)))continue;
        if(!first)pdf.addPage([pw,ph],el.orientation.value==='Horizontal'?'landscape':'portrait');first=false;
        const tile=document.createElement('canvas');tile.width=pageW;tile.height=pageH;const tileCtx=tile.getContext('2d');tileCtx.fillStyle='#fff';tileCtx.fillRect(0,0,pageW,pageH);
        tileCtx.drawImage(source,left-col*pageW,top-r*pageH,printW,printH);pdf.addImage(tile.toDataURL('image/jpeg',.94),'JPEG',0,0,pw,ph,undefined,'FAST');
        progress++;el.status.textContent=`Preparando hoja ${progress} de ${selected.size}…`;
      }
      const file=new File([pdf.output('blob')],filename,{type:'application/pdf'});
      if(navigator.share&&navigator.canShare?.({files:[file]})){
        await navigator.share({files:[file],title:filename});el.status.textContent='PDF compartido.';
      }else{
        pdf.save(filename);el.status.textContent='Este navegador no permite compartir archivos. Se descargó el PDF.';
      }
    }catch(err){if(err.name==='AbortError')el.status.textContent='Compartir cancelado.';else el.status.textContent=`No se pudo generar el PDF: ${err.message}`;}
    finally{el.save.disabled=selected.size===0;}
  });
  new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(draw,100);}).observe(el.wrap);
})();
