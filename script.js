// ==========================================
// 1. CONFIGURAÇÕES E CHAVES (CHAVE_OPENAI REMOVIDA DAQUI)
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
        elUser.innerText = "👤 Visitante";
        elCred.innerText = "Faça login para usar";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        return; 
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        elUser.innerText = "👤 " + session.user.email;
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
// 3. GERADOR COM IA (CHAMANDO ROTA SEGURA)
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

    // Feedback visual (Dicas)
    const dicaAleatoria = dicasPedagogicas[Math.floor(Math.random() * dicasPedagogicas.length)];
    const containerDica = document.getElementById('containerDica');
    if (containerDica) {
        document.getElementById('textoDica').innerText = dicaAleatoria;
        containerDica.style.display = 'block';
    }

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        // CHAMADA PARA A ROTA DA VERCEL
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema })
        });
        
        const contentIA = await response.json();
        inputConteudo.value = contentIA;

        // Descontar crédito apenas se não for PRO
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

// Funções de Histórico, Impressão, Pagamento e Logout permanecem as mesmas...
// (ImprimirDireto, ExcluirPlano, RecuperarPlano, CarregarLista, IniciarPagamento, FazerLogout, SalvarNoBanco, LimparTela, ZapDireto, PdfDireto)
// [Omitido por brevidade, mantendo sua lógica original]

verificarAcesso();