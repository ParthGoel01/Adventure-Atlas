document.addEventListener('DOMContentLoaded',()=>{
    let email_phldr = document.querySelector('.email p');
    let pass_phldr = document.querySelector('.pass p');

    let email = document.querySelector('.email input');
    let password = document.querySelector('.pass input');

    let cont_user = document.getElementById('ct_user');
    let cont_pass = document.getElementById('ct_pass');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let form = document.getElementById('loginform');

    form.addEventListener('submit',(event)=>{
        event.preventDefault();
    })
    cont_pass.addEventListener('click',()=>{
        form.submit();
    })
    //EMAIL
    email.addEventListener('focus',()=>{
        at_focus(email,email_phldr);
        let error_email = document.querySelector('.invalid_email');
        email.addEventListener('keypress',(event)=>{
            if(event.key==='Enter') event.preventDefault();
            if(event.key==='Enter' && email.value.trim().length === 0){
                error_email.innerHTML="<p><i class='fa-solid fa-circle-exclamation'></i> Enter an email address!</p>";
                error_email.style.display='flex';
            }
            else if(event.key==='Enter' && !emailRegex.test(email.value.trim())) {
                error_email.innerHTML="<p><i class='fa-solid fa-circle-exclamation'></i> Email is not valid!</p>";
                error_email.style.display='flex';
            }
            else if(event.key==='Enter' && emailRegex.test(email.value.trim())) cont_user.click();
            else error_email.style.display='none';
        })
    })
    email.addEventListener('blur',()=>{
        at_blur(email,email_phldr,'Email Address');
    })

    //PASSWORD
    password.addEventListener('focus',()=>{
        at_focus(password,pass_phldr);
        password.addEventListener('keypress',(event)=>{
            let error_password = document.querySelector('.empty_password');
            if(event.key==='Enter') event.preventDefault();
            if(event.key==='Enter' && password.value.trim()===''){
                error_password.style.display='flex'; 
            }
            else if(event.key==='Enter'){ 
                cont_pass.click();
            }
            else{
                error_password.style.display='none';
            }
        })
    })
    password.addEventListener('blur',()=>{
        at_blur(password,pass_phldr,'Password');
    })

    document.addEventListener('keypress',(event)=>{
        if(event.key==='Enter' && email.value.trim()!=='' && emailRegex.test(email.value.trim())){
            cont_user.click();
        }
    })

    let hide = document.getElementById('hide');
    hide.addEventListener('click',()=>{
        hide.classList.toggle('fa-eye');
        hide.classList.toggle('fa-eye-slash');

        if(hide.classList.contains('fa-eye-slash')) password.setAttribute('type','password');
        else password.setAttribute('type','text');
    })

    cont_user.addEventListener('click',()=>{
        if(password.value.trim()==='') password.focus();

        document.querySelector('h1').innerHTML="Enter Your Password!";
        document.getElementById('hiddenEmail').value = email.value;
        document.querySelector('h1').style.fontSize="25px";
        cont_user.style.display='none';
        document.querySelectorAll('.password ,.email span,#ct_pass').forEach(element=>{
            element.style.display='block';
        });
        email.disabled=true;
    })
    document.querySelector('.email span').addEventListener('click',()=>{
        email.disabled=false;
        email.focus();
    })
});
function at_focus(element,element_p){
    element.setAttribute('placeholder','');
    element_p.style.display='inline-block';
}   
function at_blur(element,element_p,text){
    element.setAttribute('placeholder',text);
    element_p.style.display='none';
}