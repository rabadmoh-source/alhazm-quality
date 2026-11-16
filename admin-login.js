import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
const client=createClient('https://tyxdoyiqltanvozrpxtu.supabase.co','sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio',{auth:{detectSessionInUrl:true,persistSession:true}});
const message=document.getElementById('adminLoginMessage');
const form=document.getElementById('adminLoginForm');
const input=document.getElementById('adminEmail');
const login=document.getElementById('adminLoginButton');
const logout=document.getElementById('adminLogoutButton');
form.addEventListener('submit',async event=>{
 event.preventDefault();login.disabled=true;message.textContent='جارٍ إرسال رابط التحقق...';
 const {error}=await client.auth.signInWithOtp({email:input.value.trim(),options:{emailRedirectTo:'https://rabadmoh-source.github.io/alhazm-quality/',shouldCreateUser:true}});
 login.disabled=false;
 message.textContent=error?'تعذر إرسال الرابط: '+error.message:'أُرسل رابط الدخول. افتحي Gmail على الكمبيوتر نفسه، ثم افتحي الرابط من الرسالة لتفعيل الإدارة هنا.';
});
logout.addEventListener('click',async()=>{await client.auth.signOut();logout.classList.add('hidden');login.classList.remove('hidden');message.textContent='تم تسجيل الخروج.';});
async function activate(){
 const {data:{session},error:sessionError}=await client.auth.getSession();if(sessionError){message.textContent='تعذر قراءة جلسة الدخول. حدّثي الصفحة ثم حاولي من جديد.';return;}if(!session){message.textContent='لم يُسجّل الدخول على هذا الجهاز بعد. إذا كان بريدك على الهاتف، افتحي Gmail من متصفح الكمبيوتر لتفعيل الإدارة هنا.';return;}
 const headers={authorization:'Bearer '+session.access_token,apikey:'sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio'};
 try{
  const response=await fetch('https://tyxdoyiqltanvozrpxtu.supabase.co/functions/v1/quality-admin-activate',{method:'POST',headers});
  if(!response.ok){
   const memberResponse=await fetch('https://tyxdoyiqltanvozrpxtu.supabase.co/functions/v1/quality-team',{method:'POST',headers:{...headers,'content-type':'application/json'},body:JSON.stringify({action:'activate'})});
   if(!memberResponse.ok){message.textContent='تم تسجيل الدخول، لكن البريد غير مضاف بعد إلى فريق التقويم.';return;}
   message.textContent='تم التحقق من عضويتك في فريق التقويم الذاتي.';
  }else{message.textContent='تم التحقق من حساب مديرة النظام. أصبح رفع الأدلة متاحًا في لوحات المؤشرات.';}
  login.classList.add('hidden');logout.classList.remove('hidden');
 }catch{message.textContent='تعذر الاتصال بخدمة تفعيل الصلاحيات.';}
}
activate();