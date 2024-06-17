document.addEventListener('DOMContentLoaded',()=>{
    let user_phldr = document.querySelector('.user p');
    let email_phldr = document.querySelector('.email p');
    let pass_phldr = document.querySelector('.pass p');

    let username = document.querySelector('.user input');
    let email = document.querySelector('.email input');
    let password = document.querySelector('.pass input');

    let cont_user = document.getElementById('ct_user');
    let cont_pass = document.getElementById('ct_pass');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let form = document.querySelector('#signupform');

    form.addEventListener('submit',(event)=>{
        event.preventDefault();
    })
    cont_pass.addEventListener('click',()=>{
        form.submit();
    });

    // USERNAME
    username.addEventListener('focus',()=>{
        at_focus(username, user_phldr);
        username.addEventListener('keypress',(event)=>{
            let error_username = document.querySelector('.empty_user');
            if(event.key==='Enter') event.preventDefault();
            if(event.key==="Enter" && username.value.trim()!=='' && email.value.trim()!=='') {
                cont_user.click();
            }
            else if(event.key==="Enter" && username.value.trim()!=='' && email.value.trim()===''){
                username.blur();
                email.focus();
            }
            else if(event.key==='Enter' && username.value.trim()===''){
                error_username.style.display='flex';
                username.style.marginBottom ='0rem';
            }
            else {
                error_username.style.display='none';
                username.style.marginBottom ='1rem';
            }
        })
    })
    username.addEventListener('blur',()=>{
        at_blur(username, user_phldr, 'Username');
    })

    // EMAIL
    email.addEventListener('focus',()=>{
        at_focus(email, email_phldr);
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
            else if(event.key==='Enter' && emailRegex.test(email.value.trim()) && username.value.trim()===''){
                email.blur();
                username.focus();
            }
            else if(event.key==='Enter' && emailRegex.test(email.value.trim()) && username.value.trim()!==''){
                cont_user.click();
            }
            else{
                error_email.style.display='none';
            }
        })
    })
    email.addEventListener('blur',()=>{
        at_blur(email, email_phldr, 'Email Address');
    })

    // PASSWORD
    password.addEventListener('focus',()=>{
        at_focus(password, pass_phldr);
        password.addEventListener('keypress',(event)=>{
            if(event.key==='Enter') event.preventDefault();
            let error_password = document.querySelector('.empty_password');
            if(event.key==='Enter' && password.value.trim().length>=12){
                cont_pass.click();
            }
            else if(event.key==='Enter' && password.value.trim()===''){
                error_password.style.display='flex';
            }
            else{
                error_password.style.display='none';
            }
        })
    })
    password.addEventListener('blur',()=>{
        at_blur(password, pass_phldr, 'Password');
    })

    document.addEventListener('keypress',(event)=>{
        if(event.key==='Enter' && username.value.trim()!=='' && email.value.trim()!=='' && emailRegex.test(email.value.trim()))
            cont_user.click();
    })

    let hide_password = document.getElementById('hide');
    hide_password.addEventListener('click',()=>{
        hide_password.classList.toggle('fa-eye');
        hide_password.classList.toggle('fa-eye-slash');

        if(hide_password.classList.contains('fa-eye-slash')) password.setAttribute('type','password');
        else password.setAttribute('type','text');
    })

    cont_user.addEventListener('click',()=>{
        if(password.value.trim()==='') password.focus();
        [email, username].forEach(element=>{
            element.disabled=true;
        });
        document.getElementById('hiddenUsername').value = username.value;
        document.getElementById('hiddenEmail').value = email.value;
        document.querySelectorAll('.login_options, #or, #ct_user').forEach(element =>{
            element.style.display='none';
        });
        document.querySelectorAll('.password,.user span, .email span, .instructions p, #ct_pass').forEach(element=>{
            element.style.display='block';
        });
        password.focus();
    })

    password.addEventListener('input',()=>{
        let password_check_i = document.querySelector('.check i');
        if(password.value.trim().length>=12) {
            document.querySelector('.check').style.color='var(--text)';
            password_check_i.classList.remove('fa-xmark');
            password_check_i.classList.add('fa-check');
        }
        else {
            document.querySelector('.check').style.color='red';
            password_check_i.classList.add('fa-xmark');
            password_check_i.classList.remove('fa-check');
        }
    })

    document.querySelector('.email span').addEventListener('click',()=>{
        email.disabled=false;
        email.focus();
    })

    document.querySelector('.user span').addEventListener('click',()=>{
        username.disabled=false;
        username.focus();
    })
})

function at_focus(element,element_p){
    element.setAttribute('placeholder','');
    element_p.style.display='inline-block';
}   

function at_blur(element,element_p,text){
    element.setAttribute('placeholder',text);
    element_p.style.display='none';
}
