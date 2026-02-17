// ==========================================
// 1. CONFIGURAÇÕES E CLIENTE SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO E NOME DO USUÁRIO
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado'); // Verifique se este ID existe no seu HTML
    const elCred = document.getElementById('numCreditos');

    if (!session) {
        if(elUser) elUser.innerText = "👤 Visitante";
        return; 
    }

    // Busca o perfil para mostrar o status PRO e créditos
    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        // Mostra o e-mail do usuário logado
        if(elUser) elUser.innerText = "👤 " + session.user.email;

        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            if(elCred) {
                elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
                elCred.style.color = "#25D366";
            }
        } else {
            if(elCred) {
                elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
                elCred.style.color = "#7c3aed";
            }
        }
    }
}

// ==========================================
// 3. GERADOR COM IA
// ==========================================
window.gerarComIA = async function() {
    const tema = inputTema.value;
    if (!tema) return alert("Por favor, digite um tema!");

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const resultado = await response.json();
        inputConteudo.value = typeof resultado === 'string' ? resultado : JSON.stringify(resultado);
    } catch (err) { 
        alert("Erro ao conectar com a IA."); 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. FUNÇÕES DOS BOTÕES (WHATSAPP, PDF, SALVAR)
// ==========================================

// SALVAR NO HISTÓRICO
window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Faça login para salvar!");
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");

    const { error } = await _supabase.from('atividades').insert([
        { tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }
    ]);

    if (error) alert("Erro ao salvar: " + error.message);
    else alert("✅ Planejamento salvo no seu histórico!");
};

// WHATSAPP
window.zapDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

// BAIXAR PDF
window.pdfDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save(`plano_${inputTema.value || 'sismatic'}.pdf`);
};

// IMPRIMIR
window.imprimirDireto = () => {
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`<html><body style="font-family:sans-serif; padding:40px;"><h1>${inputTema.value}</h1><hr><pre style="white-space:pre-wrap;">${inputConteudo.value}</pre><script>window.onload=function(){window.print();window.close();}<\/script></body></html>`);
    win.document.close();
};

// LIMPAR TELA
window.limparTela = () => {
    inputTema.value = "";
    inputConteudo.value = "";
};

// Inicialização
verificarAcesso();