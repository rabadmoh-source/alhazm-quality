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
 message.textContent=error?'تعذر إرسال الرابط: '+error.message:'تحققي من بريدك وافتحي رابط الدخول.';
});
logout.addEventListener('click',async()=>{await client.auth.signOut();logout.classList.add('hidden');login.classList.remove('hidden');message.textContent='تم تسجيل الخروج.';});
async function activate(){
 const {data:{session}}=await client.auth.getSession();if(!session)return;
 const headers={authorization:'Bearer '+session.access_token,apikey:'sb_publishable_6gpJNjwQTHDnMbiJJzBt9A_gILYiLio'};
 try{
  const response=await fetch('https://tyxdoyiqltanvozrpxtu.supabase.co/functions/v1/quality-admin-activate',{method:'POST',headers});
  if(!response.ok){message.textContent='حسابك مسجل، لكنه غير معتمد بصلاحية الإدارة.';return;}
  message.textContent='تم التحقق من حساب مديرة النظام.';
  login.classList.add('hidden');logout.classList.remove('hidden');
 }catch{message.textContent='تعذر الاتصال بخدمة تفعيل الصلاحيات.';}
}
activate();