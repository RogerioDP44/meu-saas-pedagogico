import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

// ==========================================
// VERIFICAÇÃO DE ACESSO E NOME
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado');
    const elCred = document.getElementById('numCreditos');
    const btnSair = document.getElementById('btnSair');
    const btnEntrar = document.getElementById('btnEntrar');
    const sessaoPlanos = document.getElementById('sessaoPlanos');

    if (!session) {
        if (elUser) elUser.innerText = "👤 Visitante";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        return;
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if (elUser) elUser.innerText = "👤 " + session.user.email;
        if (btnEntrar) btnEntrar.style.display = 'none';
        if (btnSair) btnSair.style.display = 'inline';

        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            if (elCred) elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            if (elCred) elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
            if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        }
        carregarLista();
    }
}

// ==========================================
// FUNÇÕES DOS BOTÕES
// ==========================================
window.gerarComIA = async function() {
    if (!inputTema.value) return alert("Digite um tema!");
    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema: inputTema.value })
        });
        const resultado = await response.json();
        inputConteudo.value = resultado;
    } catch (err) { alert("Erro na IA."); }
    finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Faça login!");
    await _supabase.from('atividades').insert([{ tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }]);
    alert("✅ Salvo!"); 
    carregarLista();
};

window.pdfDireto = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(doc.splitTextToSize(inputConteudo.value, 180), 15, 20);
    doc.save(`plano.pdf`);
};

window.zapDireto = () => {
    const msg = encodeURIComponent(`*Sismatic*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.imprimirDireto = () => {
    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`<pre style="white-space:pre-wrap; padding:40px;">${inputConteudo.value}</pre>`);
    win.document.close();
    win.print();
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

async function carregarLista() {
    const { data: { session } } = await _supabase.auth.getSession();
    const { data } = await _supabase.from('atividades').select('*').eq('user_id', session.user.id).order('id', {ascending: false});
    const listaDiv = document.getElementById('listaAtividades');
    if (listaDiv && data) {
        listaDiv.innerHTML = data.map(item => `
            <div onclick="recuperarPlano(${item.id})" style="border:1px solid #ddd; padding:10px; margin-top:5px; border-radius:8px; cursor:pointer; background:white;">
                <strong>📋 ${item.tema}</strong>
            </div>
        `).join('');
    }
}

window.recuperarPlano = async (id) => {
    const { data } = await _supabase.from('atividades').select('*').eq('id', id).single();
    if (data) {
        inputTema.value = data.tema;
        inputConteudo.value = data.conteudo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.fazerLogout = async (e) => {
    if(e) e.preventDefault();
    await _supabase.auth.signOut();
    window.location.href = "login.html";
};

// Rodar ao carregar
verificarAcesso();