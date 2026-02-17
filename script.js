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
// 2. VERIFICAÇÃO DE ACESSO E PERFIL
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
// 3. GERADOR COM IA (ROTA SEGURA VERCEL)
// ==========================================
window.gerarComIA = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        alert("📚 Você precisa de uma conta para gerar planejamentos!");
        window.location.href = "login.html";
        return;
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    if (!perfil.plano_pro && perfil.creditos_teste <= 0) return alert("Assine o PRO para continuar!");

    const tema = inputTema.value;
    if (!tema) return alert("Digite um tema!");

    const dicaAleatoria = dicasPedagogicas[Math.floor(Math.random() * dicasPedagogicas.length)];
    const containerDica = document.getElementById('containerDica');
    if (containerDica) {
        document.getElementById('textoDica').innerText = dicaAleatoria;
        containerDica.style.display = 'block';
    }

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const contentIA = await response.json();
        inputConteudo.value = contentIA;

        if (!perfil.plano_pro) {
            await _supabase.from('perfis').update({ creditos_teste: perfil.creditos_teste - 1 }).eq('id', session.user.id);
        }
        verificarAcesso();
    } catch (err) { 
        alert("Erro na IA. Verifique sua conexão."); 
    } finally {
        if (containerDica) containerDica.style.display = 'none';
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. PAGAMENTO (MERCADO PAGO)
// ==========================================
window.iniciarPagamento = async (plano) => {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        alert("Faça login para assinar!");
        return window.location.href = "login.html";
    }

    try {
        const response = await fetch("/api/criarPreferencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idUsuario: session.user.id,
                plano: plano
            })
        });

        const data = await response.json();
        if (data.init_point) {
            window.location.href = data.init_point;
        } else {
            alert("Erro ao gerar pagamento.");
        }
    } catch (e) {
        alert("Erro de conexão.");
    }
};

// ==========================================
// 5. UTILITÁRIOS (PDF, WHATSAPP, HISTÓRICO)
// ==========================================
window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Faça login!");
    if (!inputConteudo.value) return alert("Gere um plano primeiro!");
    await _supabase.from('atividades').insert([{ tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }]);
    alert("✅ Salvo!"); carregarLista();
};

window.zapDireto = () => {
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.pdfDireto = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save("plano_sismatic.pdf");
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

window.fazerLogout = async () => {
    await _supabase.auth.signOut();
    window.location.href = "login.html";
};

// Inicialização
verificarAcesso();