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
        if (elUser) elUser.innerText = "👤 Visitante";
        if (elCred) elCred.innerText = "Faça login para usar";
        if (btnEntrar) btnEntrar.style.display = 'inline';
        if (btnSair) btnSair.style.display = 'none';
        if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        return; 
    }

    const { data: perfil } = await _supabase.from('perfis').select('*').eq('id', session.user.id).single();
    
    if (perfil) {
        if (elUser) elUser.innerText = "👤 " + session.user.email;
        if (btnEntrar) btnEntrar.style.display = 'none';
        if (btnSair) btnSair.style.display = 'inline';

        if (perfil.plano_pro) {
            const hoje = new Date();
            const expira = perfil.expira_em ? new Date(perfil.expira_em) : hoje;
            const diffTime = expira - hoje; // CORRIGIDO: de 'hoy' para 'hoje'
            const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (elCred) {
                elCred.innerText = `Assinante PRO ✅ (${diasRestantes} dias)`;
                elCred.style.color = "#25D366";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'none';
        } else {
            if (elCred) {
                elCred.innerText = (perfil.creditos_teste || 0) + " créditos";
                elCred.style.color = "#7c3aed";
            }
            if (sessaoPlanos) sessaoPlanos.style.display = 'block';
        }
        carregarLista(); 
    }
}

// ==========================================
// 3. GERADOR COM IA
// ==========================================
window.gerarComIA = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) {
        alert("📚 Você precisa de uma conta para gerar planejamentos!");
        window.location.href = "login.html";
        return;
    }

    if (!inputTema.value) return alert("Por favor, digite um tema!");

    btnIA.innerText = "Sismatic gerando... 🧠";
    btnIA.disabled = true;

    try {
        const response = await fetch("/api/gerarPlano", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema: inputTema.value })
        });
        const resultado = await response.json();
        inputConteudo.value = typeof resultado === 'string' ? resultado : (resultado.texto || JSON.stringify(resultado));
        
        verificarAcesso(); // Atualiza créditos após gerar
    } catch (err) { 
        alert("Erro na IA. Verifique a sua conexão."); 
    } finally {
        btnIA.innerText = "✨ Gerar Planejamento";
        btnIA.disabled = false;
    }
};

// ==========================================
// 4. HISTÓRICO E AÇÕES
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
            <div class="historico-item" onclick="recuperarPlano('${item.id}')">
                <div><strong>📋 ${item.tema}</strong><br><small>${new Date(item.created_at).toLocaleDateString()}</small></div>
            </div>
        `).join('');
    }
}

window.salvarNoBanco = async function() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return alert("Inicie sessão para guardar!");
    if (!inputConteudo.value) return alert("Gere um plano antes de salvar!");

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

// Funções de Exportação (PDF e WhatsApp)
window.zapDireto = () => {
    if (!inputConteudo.value) return alert("Gere o plano primeiro!");
    const msg = encodeURIComponent(`*Sismatic - Plano de Aula*\n\n${inputConteudo.value}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
};

window.pdfDireto = () => {
    if (!inputConteudo.value) return alert("Gere o plano primeiro!");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const texto = doc.splitTextToSize(inputConteudo.value, 180);
    doc.text(texto, 15, 20);
    doc.save("plano_sismatic.pdf");
};

// Inicialização
document.addEventListener('DOMContentLoaded', verificarAcesso);