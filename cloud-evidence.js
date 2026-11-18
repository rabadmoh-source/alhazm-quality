import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const api='https://tyxdoyiqltanvozrpxtu.supabase.co';
const key='sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio';
const client=createClient(api,key,{auth:{detectSessionInUrl:true,persistSession:true}});
const evidenceNode=document.getElementById('evidence');
const area=document.createElement('section');
area.id='cloudEvidencePanel';
area.className='cloud-evidence-panel';
area.innerHTML='<h3 class="cloud-gallery-title">📁 الشواهد المحفوظة لهذا المؤشر</h3><p class="cloud-help" id="cloudAccessHelp">لإضافة الصور والملفات، سجّلي الدخول من خانة «دخول إدارة منصة الجودة» أعلى الصفحة. ستظهر استمارة الرفع هنا فور تفعيل صلاحية حسابك. لا يلزم أعضاء الفريق التعامل مع أي برمجيات.</p><div id="cloudEvidenceItems"></div><button type="button" class="primary hidden" id="cloudUploadToggle">＋ إضافة شاهد جديد</button><form id="cloudEvidenceForm" class="cloud-upload-form hidden"><label>عنوان الشاهد<input id="cloudTitle" required maxlength="300" placeholder="عنوان واضح للدليل"></label><label>وصف الشاهد<textarea id="cloudDescription" maxlength="2000" placeholder="وصف اختياري"></textarea></label><label>اختيار ملف<input id="cloudFile" type="file" required accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xlsx,.pptx"></label><small>المرحلة التجريبية: صور وملفات حتى 5 ميجابايت. دعم الفيديوهات الكبيرة لاحقًا.</small><button class="primary" type="submit">حفظ الشاهد سحابيًا</button></form><p id="cloudEvidenceStatus" role="status"></p>';
const styles=document.createElement('style');
styles.textContent=`
#cloudEvidencePanel{padding:4px 0 10px;max-width:100%;min-width:0}
#cloudEvidencePanel .cloud-gallery-title{font-size:17px;margin:10px 0;color:#563879}
#cloudEvidenceItems{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;margin:16px 0}
#cloudEvidenceItems .quality-evidence-card{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;min-width:0;padding:18px;border-radius:17px;border:1px solid #e5dcf1;background:#fff;box-shadow:0 7px 20px #3821560b}
.quality-evidence-preview{flex:0 1 240px;width:240px;max-width:100%;height:172px;border-radius:13px;background:#f4f1f9;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#735b8d;font-size:48px}
.quality-evidence-preview img{width:100%;height:100%;object-fit:contain;background:#f9f7fc}
.quality-evidence-content{flex:1 1 260px;min-width:0;overflow-wrap:anywhere}
.quality-evidence-content h4{font-size:20px;color:#39265c;margin:3px 0 12px}
.quality-evidence-content p{line-height:1.8;margin:0 0 12px;color:#645a71}
.quality-evidence-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.quality-evidence-actions button{margin:0!important}
.quality-evidence-editor{background:#f8f6fb;border:1px solid #e8e0f1;border-radius:13px;padding:14px;margin-top:14px;display:grid;gap:10px}
.quality-evidence-editor label{font-weight:700;color:#563879;display:grid;gap:6px}
.quality-evidence-editor input,.quality-evidence-editor textarea{width:100%;max-width:100%;padding:10px;border:1px solid #e3dcec;border-radius:9px;background:white;font:inherit}
.quality-evidence-editor textarea{min-height:80px}
.quality-evidence-editor small{color:#726780}
#cloudUploadToggle{margin:10px 0 16px;display:inline-block}
#cloudEvidenceForm{border:1px solid #e7dff2;border-radius:15px;background:#faf8fd;padding:18px;max-width:100%;margin-top:8px}
`;
document.head.append(styles);
evidenceNode.before(area);
const localAdd=document.getElementById('addBtn');
if(localAdd)localAdd.classList.add('hidden');
evidenceNode.classList.add('hidden');
const $=id=>document.getElementById(id);
let session=null,indicators=[],permissionRole=null,previewUrls=[],renderGeneration=0,editingEvidenceId=null,editingIndicatorCode=null;
const toggle=$('cloudUploadToggle');
toggle.addEventListener('click',()=>{$('cloudEvidenceForm').classList.toggle('hidden');toggle.textContent=$('cloudEvidenceForm').classList.contains('hidden')?'＋ إضافة شاهد جديد':'إغلاق استمارة الإضافة';});
async function call(route,options={}){
 const url=api+'/functions/v1/'+route;
 const resp=await fetch(url,{...options,headers:{apikey:key,authorization:'Bearer '+session.access_token,...options.headers}});
 if(!resp.ok){const e=await resp.json().catch(()=>({}));throw new Error((e.error||'network_error')+(e.reason?' ('+e.reason+(e.http_status?' / '+e.http_status:'')+')':''));}
 return resp;
}
async function init(){
 const auth=await client.auth.getSession();session=auth.data.session;
 if(!session){$('cloudEvidenceStatus').textContent='لرفع دليل جديد: سجّلي الدخول أولًا باستخدام البريد المعتمد.';return;}
 try{
  const response=await call('quality-evidence-api/catalog');
  const catalog=await response.json();indicators=catalog.indicators||[];permissionRole=catalog.role;
  document.body.classList.add('cloud-authenticated');$('cloudAccessHelp').textContent='أنتِ الآن في مساحة الأدلة السحابية. اختاري ملفًا ثم احفظيه، وسيظهر للشخص المخوّل ضمن هذا المؤشر.';
  if(['admin','editor'].includes(catalog.role))toggle.classList.remove('hidden');else {$('cloudAccessHelp').textContent='لديك صلاحية الاطلاع فقط على الشواهد، وليس رفع الملفات.';toggle.classList.add('hidden');}
  await render();
 }catch{
  $('cloudEvidenceStatus').textContent='الحساب غير مفعل للوصول إلى أدلة المؤشرات بعد.';
 }
}
async function render(){
 const generation=++renderGeneration;
 if(!session)return;
 const code=$('codeBadge')?.textContent?.match(/\d+\.\d+\.\d+/)?.[0];
 if(editingEvidenceId&&editingIndicatorCode===code)return 1;
 if(editingIndicatorCode!==code){editingEvidenceId=null;editingIndicatorCode=null;}
 const indicator=indicators.find(x=>x.code===code);
 const list=$('cloudEvidenceItems');for(const url of previewUrls)URL.revokeObjectURL(url);previewUrls=[];list.replaceChildren();
 if(!indicator){$('cloudEvidenceStatus').textContent='هذا المؤشر قيد الإعداد.';return;}
 $('cloudEvidenceStatus').textContent='';
 try{
  const r=await call('quality-evidence-api/evidence?indicator='+encodeURIComponent(indicator.id));
  const data=await r.json();
  if(generation!==renderGeneration)return 0;
  const items=data.items||[];
  if(!items.length){const el=document.createElement('p');el.className='note';el.textContent='لا توجد شواهد محفوظة سحابيًا لهذا المؤشر حتى الآن.';list.append(el);return 0;}
  for(const row of items){
   const item=row.quality_evidence;if(!item)continue;
   const card=document.createElement('article');card.className='quality-evidence-card';
   const visual=document.createElement('div');visual.className='quality-evidence-preview';visual.textContent=item.mime_type?.startsWith('image/')?'🖼️':item.mime_type==='application/pdf'?'📕':'📄';
   if(item.mime_type?.startsWith('image/')){
    call('quality-evidence-download?id='+encodeURIComponent(item.id)).then(r=>r.blob()).then(blob=>{if(!card.isConnected)return;const url=URL.createObjectURL(blob);previewUrls.push(url);const img=document.createElement('img');img.alt='معاينة '+item.title;img.src=url;visual.replaceChildren(img);}).catch(()=>{visual.textContent='تعذرت معاينة الصورة';visual.style.fontSize='14px';});
   }
   const content=document.createElement('div');content.className='quality-evidence-content';
   const actions=document.createElement('div');actions.className='quality-evidence-actions';
   const title=document.createElement('h4');title.textContent=item.title;
   const desc=document.createElement('p');desc.textContent=item.description||item.original_filename;
   const status=document.createElement('small');status.textContent=item.status==='approved'?'معتمد':'مسودة';
   const download=document.createElement('button');download.className='secondary';download.textContent='تنزيل الملف';
   download.onclick=async()=>{
    download.disabled=true;
    try{
     const result=await call('quality-evidence-download?id='+encodeURIComponent(item.id));
     const blob=await result.blob();const url=URL.createObjectURL(blob);
     const anchor=document.createElement('a');anchor.href=url;anchor.download=item.original_filename;anchor.click();
     setTimeout(()=>URL.revokeObjectURL(url),10000);
    }catch{alert('تعذر تنزيل الملف. يرجى إعادة المحاولة.')}finally{download.disabled=false;}
   };
   content.append(title,desc,status);actions.append(download);
   if(['admin','editor'].includes(permissionRole)){
    const edit=document.createElement('button');edit.type='button';edit.className='secondary';edit.textContent='✏️ تعديل';
    edit.style.margin='5px';
    const editor=document.createElement('form');
    editor.className='quality-evidence-editor hidden';
    editor.innerHTML='<label>عنوان الشاهد<input name="title" required maxlength="300"></label><label>وصف الشاهد<textarea name="description" maxlength="2000"></textarea></label><label>استبدال الصورة أو الملف (اختياري)<input name="file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xlsx,.pptx"></label><small>إذا لم تختاري ملفًا جديدًا فسيبقى الملف الحالي كما هو. الحد الأقصى 5 ميجابايت.</small><div class="quality-evidence-actions"><button type="submit" class="primary">حفظ التعديلات</button><button type="button" class="secondary" data-cancel>إلغاء</button></div>';
    editor.elements.namedItem('title').value=item.title;
    editor.elements.namedItem('description').value=item.description||'';
    edit.onclick=()=>{editor.classList.toggle('hidden');const opened=!editor.classList.contains('hidden');editingEvidenceId=opened?item.id:null;editingIndicatorCode=opened?$('codeBadge')?.textContent?.match(/\d+\.\d+\.\d+/)?.[0]:null;edit.textContent=opened?'إغلاق التعديل':'✏️ تعديل';};
    editor.querySelector('[data-cancel]').onclick=()=>{editor.classList.add('hidden');editingEvidenceId=null;editingIndicatorCode=null;edit.textContent='✏️ تعديل';};
    editor.addEventListener('submit',async event=>{
     event.preventDefault();
     const title=editor.elements.namedItem('title').value.trim();
     const description=editor.elements.namedItem('description').value.trim();
     const file=editor.elements.namedItem('file').files[0];
     if(file && file.size>5*1024*1024){alert('الملف أكبر من 5 ميجابايت.');return;}
     if(!title){alert('عنوان الشاهد مطلوب.');return;}
     const body=new FormData();body.append('action','update');body.append('id',item.id);body.append('title',title);body.append('description',description);
     if(file)body.append('file',file);
     const save=editor.querySelector('[type="submit"]');save.disabled=true;save.textContent='جارٍ حفظ التعديلات...';
     try{await call('quality-evidence-manage',{method:'POST',body});editingEvidenceId=null;editingIndicatorCode=null;await render();}
     catch(error){alert('تعذر حفظ التعديل: '+error.message);save.disabled=false;save.textContent='حفظ التعديلات';}
    });
    const remove=document.createElement('button');remove.type='button';remove.className='secondary';remove.textContent='🗑️ حذف';
    remove.style.margin='5px';
    remove.onclick=async()=>{
     if(!confirm('هل تريدين حذف هذا الشاهد وملفه السحابي نهائيًا؟ لا يمكن التراجع.'))return;
     remove.disabled=true;
     try{
      await call('quality-evidence-manage',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'delete',id:item.id})});
      await render();
     }catch{alert('تعذر حذف الشاهد.');remove.disabled=false;}
    };
    actions.append(edit,remove);content.append(editor);
   }
   content.append(actions);card.append(visual,content);list.append(card);
  }
  return items.length;
 }catch{$('cloudEvidenceStatus').textContent='تعذر تحديث الأدلة السحابية حاليًا.';return 0;}
}
$('cloudEvidenceForm').addEventListener('submit',async e=>{
 e.preventDefault();const code=$('codeBadge')?.textContent?.match(/\d+\.\d+\.\d+/)?.[0];
 const indicator=indicators.find(x=>x.code===code),file=$('cloudFile').files[0];
 if(!indicator||!file)return;
 if(file.size>5*1024*1024){$('cloudEvidenceStatus').textContent='الملف أكبر من الحد التجريبي 5 ميجابايت.';return;}
 const body=new FormData();body.append('file',file);body.append('indicator_id',indicator.id);body.append('title',$('cloudTitle').value);body.append('description',$('cloudDescription').value);
 const btn=e.target.querySelector('button');btn.disabled=true;$('cloudEvidenceStatus').textContent='جارٍ رفع الشاهد...';
 try{
  const response=await call('quality-evidence-upload',{method:'POST',body});const data=await response.json();
  if(!data.success){$('cloudEvidenceStatus').textContent='لم يكتمل حفظ الشاهد.';return;}
  e.target.reset();
  e.target.classList.add('hidden');toggle.textContent='＋ إضافة شاهد جديد';
  const visibleCount=await render();
  if(visibleCount>0)$('cloudEvidenceStatus').textContent='✅ تم حفظ الشاهد سحابيًا. تظهر بطاقته أعلاه ويمكنك تعديلها أو حذفها.';
  else $('cloudEvidenceStatus').textContent='تم قبول الرفع، لكن لم يظهر الشاهد في اللوحة. يرجى عدم إعادة الرفع قبل التحقق.';
 }catch(error){$('cloudEvidenceStatus').textContent='لم ينجح الرفع: '+error.message;}finally{btn.disabled=false;}
});
document.getElementById('indicatorList').addEventListener('click',()=>setTimeout(render,0));
document.getElementById('standards').addEventListener('click',()=>setTimeout(render,0));
document.addEventListener('quality-indicator-changed',()=>setTimeout(render,0));
client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'){setTimeout(()=>init(),200);}else if(event==='SIGNED_OUT'){session=null;document.body.classList.remove('cloud-authenticated');$('cloudEvidenceForm').classList.add('hidden');$('cloudAccessHelp').textContent='سجّلي الدخول من أعلى الصفحة لرفع الأدلة.';}});
init();
document.addEventListener('quality-login-ready',()=>init());
document.addEventListener('quality-logout-ready',()=>{session=null;document.body.classList.remove('cloud-authenticated');$('cloudEvidenceForm').classList.add('hidden');$('cloudEvidenceItems').replaceChildren();});
