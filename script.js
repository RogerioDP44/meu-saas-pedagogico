// ==========================================
// 1. CONFIGURAÇÕES SUPABASE
// ==========================================
const supabaseUrl = 'https://bdlgtweiktdnipvtolfr.supabase.co';
const supabaseKey = 'sb_publishable_IVy8AYPapIr4iijYTwdXNw_tOkrDZEf';
const _supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const btnIA = document.getElementById('btnIA');
const inputTema = document.getElementById('inputTema');
const inputConteudo = document.getElementById('inputConteudo');

// ==========================================
// 2. VERIFICAÇÃO DE ACESSO (NOME E STATUS)
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

    // Exibe o email do utilizador no topo
    if (elUser) elUser.innerText = "👤 " + session.user.email;
    if (btnEntrar) btnEntrar.style.display = 'none';
    if (btnSair) btnSair.style.display = 'inline';

    // Procura o perfil para confirmar o Plano PRO
    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil && elCred) {
        if (perfil.plano_pro) {
            const expira = new Date(perfil.expira_em);
            const dias = Math.ceil((expira - new Date()) / (1000 * 60 * 60 * 24));
            elCred.innerText = `Assinante PRO ✅ (${dias} dias)`;
            elCred.style.color = "#25D366";
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
        }
    }
    carregarLista(); // Carrega o histórico de planejamentos
}

// ==========================================
// 3. GERADOR COM IA (PEDAGÓGICO)
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
        // Garante que o texto não venha como [object Object]
        inputConteudo.value = typeof resultado === 'string' ? resultado : (resultado.texto || JSON.stringify(resultado));
    } catch (err) { 
        alert("Erro na IA. Verifique a sua conexão."); 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. HISTÓRICO E BOTÕES DE ACÇÃO
// ==========================================
async function carregarLista() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    const { data } = await _supabase.from('atividades')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

    const listaDiv = document.getElementById('listaAtividades');
    if (listaDiv && data) {
        listaDiv.innerHTML = data.map(item => `
            <div class="historico-item" onclick="recuperarPlano('${item.id}')" style="background:#f8fafc; border-left:5px solid #7c3aed; padding:12px; border-radius:10px; margin-bottom:10px; cursor:pointer;">
                <strong>📋 ${item.tema}</strong><br>
                <small style="color:#999;">${new Date(item.created_at).toLocaleDateString()}</small>
            </div>
        `).join('');
    }
}

window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Inicie sessão para guardar!");

    const { error } = await _supabase.from('atividades').insert([
        { tema: inputTema.value, conteudo: inputConteudo.value, user_id: session.user.id }
    ]);

    if (error) alert("Erro ao guardar.");
    else {
        alert("✅ Planeamento guardado!");
        carregarLista();
    }
};

window.recuperarPlano = async (id) => {
    const { data } = await _supabase.from('atividades').select('*').eq('id', id).single();
    if (data) {
        inputTema.value = data.tema;
        inputConteudo.value = data.conteudo;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

window.limparTela = () => { inputTema.value = ""; inputConteudo.value = ""; };

window.fazerLogout = async (e) => {
    if(e) e.preventDefault();
    await _supabase.auth.signOut();
    window.location.reload();
};

// Inicialização
verificarAcesso();