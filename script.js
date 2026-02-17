// ==========================================
// 1. CONFIGURAÇÕES E CLIENTE SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

const dicasPedagogicas = [
    "A ludicidade ajuda na fixação de conceitos complexos na Educação Infantil.",
    "Ao planejar, foque sempre nas competências gerais da BNCC.",
    "A avaliação contínua é mais eficaz que uma única prova ao final do bimestre.",
    "Utilizar recursos visuais aumenta a retenção de conteúdo em até 60%.",
    "A escuta ativa dos alunos pode gerar insights incríveis para o próximo plano."
];

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO
// ==========================================
async function verificarAcesso() {
    const { data: { session } } = await _supabase.auth.getSession();
    const elUser = document.getElementById('userLogado');
    const elCred = document.getElementById('numCreditos');
    const btnSair = document.getElementById('btnSair');
    const btnEntrar = document.getElementById('btnEntrar');
    const sessaoPlanos = document.getElementById('sessaoPlanos');

    if (!session) {
        if(elUser) elUser.innerText = "👤 Visitante";
        if(elCred) elCred.innerText = "Faça login para usar";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        return; 
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if(elUser) elUser.innerText = "👤 " + session.user.email;
        if (btnEntrar) btnEntrar.style.display = 'none';
        if (btnSair) btnSair.style.display = 'inline';

        if (perfil.plano_pro) {
            const hoje = new Date();
            const expira = new Date(perfil.expira_em);
            const diasRestantes = Math.ceil((expira - hoje) / (1000 * 60 * 60 * 24));
            elCred.innerText = `Assinante PRO ✅ (${diasRestantes} dias)`;
            elCred.style.color = "#25D366";
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
            elCred.style.color = "#7c3aed";
            if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        }
        carregarLista();
    }
}

// ==========================================
// 3. GERADOR COM IA (CORREÇÃO OBJECT OBJECT)
// ==========================================
window.gerarComIA = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return window.location.href = "login.html";

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    if (!perfil.plano_pro && perfil.creditos_teste <= 0) return alert("Assine o PRO para continuar!");

    const tema = inputTema.value;
    if (!tema) return alert("Digite um tema!");

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const contentIA = await response.json();
        
        // CORREÇÃO AQUI: Garante que estamos pegando o texto, não o objeto
        inputConteudo.value = typeof contentIA === 'object' ? (contentIA.texto || JSON.stringify(contentIA)) : contentIA;

        if (!perfil.plano_pro) {
            await _supabase.from('perfis').update({ creditos_teste: perfil.creditos_teste - 1 }).eq('id', session.user.id);
        }
        verificarAcesso();
    } catch (err) { 
        alert("Erro na IA."); 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. IMPRIMIR E UTILITÁRIOS
// ==========================================
window.imprimirDireto = () => {
    const conteudo = inputConteudo.value;
    if (!conteudo || conteudo.includes("[object")) return alert("Gere um plano primeiro!");

    const win = window.open('', '', 'height=700,width=700');
    win.document.write(`
        <html>
            <body style="font-family:sans-serif; padding:40px;">
                <h1 style="color:#7c3aed;">${inputTema.value}</h1>
                <hr>
                <pre style="white-space:pre-wrap; font-size:14px;">${conteudo}</pre>
                <script>window.onload=function(){window.print();window.close();}<\/script>
            </body>
        </html>
    `);
    win.document.close();
};

window.pdfDireto = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save("plano_sismatic.pdf");
};

window.zapDireto = () => {
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

// Inicialização
verificarAcesso();