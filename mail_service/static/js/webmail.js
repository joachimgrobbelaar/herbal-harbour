/**
 * Herbal Harbour Webmail Portal - Interactive Client
 */

const state = {
    currentAccount: 'admin@herbalharbour.co.za',
    currentFolder: 'inbox',
    searchQuery: '',
    selectedMessageId: null,
    messages: [],
    accounts: [],
    pollingInterval: null,
};

// DOM Elements
const el = {
    accountSelect: document.getElementById('accountSelect'),
    accountBadge: document.getElementById('accountBadge'),
    searchBox: document.getElementById('searchBox'),
    folderInbox: document.getElementById('folder-inbox'),
    folderSent: document.getElementById('folder-sent'),
    folderDrafts: document.getElementById('folder-drafts'),
    folderTrash: document.getElementById('folder-trash'),
    badgeInbox: document.getElementById('badge-inbox'),
    badgeSent: document.getElementById('badge-sent'),
    badgeTrash: document.getElementById('badge-trash'),
    messageList: document.getElementById('messageList'),
    messageCountText: document.getElementById('messageCountText'),
    messageDetail: document.getElementById('messageDetail'),
    detailPlaceholder: document.getElementById('detailPlaceholder'),
    detailView: document.getElementById('detailView'),
    composeModal: document.getElementById('composeModal'),
    composeForm: document.getElementById('composeForm'),
    btnOpenCompose: document.getElementById('btnOpenCompose'),
    btnCloseCompose: document.getElementById('btnCloseCompose'),
    btnRefresh: document.getElementById('btnRefresh'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),
};

// Utilities
function showToast(message, isError = false) {
    if (!el.toast) return;
    el.toastMsg.textContent = message;
    el.toast.className = `fixed bottom-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-xl border text-xs font-bold transition-all flex items-center gap-2 ${
        isError ? 'bg-rose-900 text-white border-rose-500' : 'bg-[#143329] text-emerald-300 border-emerald-500'
    }`;
    el.toast.classList.remove('hidden');
    setTimeout(() => {
        el.toast.classList.add('hidden');
    }, 3500);
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
        const d = new Date(isoStr);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
        return isoStr;
    }
}

// API Functions
async function fetchAccounts() {
    try {
        const res = await fetch('/api/accounts');
        if (!res.ok) return;
        const data = await res.json();
        state.accounts = data.accounts || [];

        // Update selector
        if (el.accountSelect && el.accountSelect.options.length === 0) {
            el.accountSelect.innerHTML = '';
            state.accounts.forEach(acc => {
                const opt = document.createElement('option');
                opt.value = acc.email;
                opt.textContent = `${acc.email} (${acc.label})`;
                el.accountSelect.appendChild(opt);
            });
            el.accountSelect.value = state.currentAccount;
        }

        // Update badges for current account
        const currentAccData = state.accounts.find(a => a.email === state.currentAccount);
        if (currentAccData && currentAccData.stats) {
            const s = currentAccData.stats;
            if (el.badgeInbox) el.badgeInbox.textContent = s.inbox_unread > 0 ? s.inbox_unread : '';
            if (el.badgeSent) el.badgeSent.textContent = s.sent_total > 0 ? s.sent_total : '';
            if (el.badgeTrash) el.badgeTrash.textContent = s.trash_total > 0 ? s.trash_total : '';
        }
    } catch (err) {
        console.error('Failed to fetch accounts:', err);
    }
}

async function fetchMessages(keepSelected = true) {
    try {
        const params = new URLSearchParams({
            account: state.currentAccount,
            folder: state.currentFolder,
            limit: '100',
        });
        if (state.searchQuery.trim()) {
            params.append('search', state.searchQuery.trim());
        }

        const res = await fetch(`/api/messages?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load messages');
        const data = await res.json();
        state.messages = data.messages || [];

        renderMessageList();

        if (keepSelected && state.selectedMessageId) {
            const exists = state.messages.find(m => m.id === state.selectedMessageId);
            if (exists) {
                loadMessageDetail(state.selectedMessageId, false);
            } else {
                deselectMessage();
            }
        }
    } catch (err) {
        console.error('Fetch messages error:', err);
    }
}

function renderMessageList() {
    if (!el.messageList) return;
    el.messageList.innerHTML = '';

    if (el.messageCountText) {
        el.messageCountText.textContent = `${state.messages.length} message${state.messages.length === 1 ? '' : 's'}`;
    }

    if (state.messages.length === 0) {
        el.messageList.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <div class="text-3xl mb-2">📭</div>
                <div class="text-sm font-semibold">No messages in ${state.currentFolder}</div>
                <div class="text-xs text-slate-400 mt-1">Verification emails and incoming messages will appear here.</div>
            </div>
        `;
        return;
    }

    state.messages.forEach(msg => {
        const item = document.createElement('div');
        const isSelected = msg.id === state.selectedMessageId;
        const isUnread = msg.is_read === 0;

        item.className = `p-3.5 border-b border-slate-100 cursor-pointer transition-colors text-xs ${
            isSelected ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50'
        } ${isUnread ? 'bg-emerald-50/30 font-semibold' : 'text-slate-600'}`;

        item.onclick = () => selectMessage(msg.id);

        item.innerHTML = `
            <div class="flex items-center justify-between gap-2 mb-1">
                <div class="flex items-center gap-1.5 truncate">
                    ${isUnread ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>' : ''}
                    <span class="truncate font-bold text-slate-900">${escapeHtml(msg.from_address)}</span>
                </div>
                <span class="text-[10px] text-slate-400 whitespace-nowrap">${formatDate(msg.created_at)}</span>
            </div>
            <div class="text-slate-900 truncate font-medium mb-0.5">${escapeHtml(msg.subject || '(No Subject)')}</div>
            <div class="text-slate-400 text-[11px] truncate">${escapeHtml(msg.snippet || '')}</div>
        `;

        el.messageList.appendChild(item);
    });
}

async function selectMessage(id) {
    state.selectedMessageId = id;
    renderMessageList();
    await loadMessageDetail(id, true);
    fetchAccounts();
}

async function loadMessageDetail(id, markRead = true) {
    try {
        const res = await fetch(`/api/messages/${id}?mark_read=${markRead}`);
        if (!res.ok) throw new Error('Message not found');
        const msg = await res.json();

        if (el.detailPlaceholder) el.detailPlaceholder.classList.add('hidden');
        if (el.detailView) el.detailView.classList.remove('hidden');

        document.getElementById('msgSubject').textContent = msg.subject || '(No Subject)';
        document.getElementById('msgFrom').textContent = msg.from_address;
        document.getElementById('msgTo').textContent = msg.to_address;
        document.getElementById('msgDate').textContent = new Date(msg.created_at).toLocaleString();
        
        // Render Body
        const bodyContainer = document.getElementById('msgBody');
        if (msg.body_html && msg.body_html.trim()) {
            bodyContainer.innerHTML = msg.body_html;
        } else {
            bodyContainer.innerHTML = `<pre class="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">${escapeHtml(msg.body_plain || '')}</pre>`;
        }

        // Action buttons
        document.getElementById('btnReply').onclick = () => {
            openComposeModal({
                to: msg.from_address,
                subject: msg.subject.startsWith('Re:') ? msg.subject : `Re: ${msg.subject}`,
                body: `\n\n--- On ${new Date(msg.created_at).toLocaleString()}, ${msg.from_address} wrote:\n> ${msg.body_plain.replace(/\n/g, '\n> ')}`
            });
        };

        document.getElementById('btnDeleteMsg').onclick = async () => {
            if (confirm('Delete this message?')) {
                await fetch(`/api/messages/${id}`, { method: 'DELETE' });
                showToast('Message deleted');
                deselectMessage();
                fetchMessages();
                fetchAccounts();
            }
        };

        document.getElementById('btnToggleRead').onclick = async () => {
            const nextRead = msg.is_read ? 0 : 1;
            await fetch(`/api/messages/${id}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: nextRead }),
            });
            showToast(nextRead ? 'Marked as read' : 'Marked as unread');
            loadMessageDetail(id, false);
            fetchMessages();
            fetchAccounts();
        };

    } catch (err) {
        console.error('Failed to load message detail:', err);
    }
}

function deselectMessage() {
    state.selectedMessageId = null;
    if (el.detailPlaceholder) el.detailPlaceholder.classList.remove('hidden');
    if (el.detailView) el.detailView.classList.add('hidden');
}

// Compose Modal
function openComposeModal(initialData = {}) {
    if (!el.composeModal) return;
    document.getElementById('composeFrom').value = state.currentAccount;
    document.getElementById('composeTo').value = initialData.to || '';
    document.getElementById('composeSubject').value = initialData.subject || '';
    document.getElementById('composeBody').value = initialData.body || '';
    el.composeModal.classList.remove('hidden');
}

function closeComposeModal() {
    if (!el.composeModal) return;
    el.composeModal.classList.add('hidden');
}

async function handleSendMessage(e) {
    e.preventDefault();
    const payload = {
        from: document.getElementById('composeFrom').value,
        to: document.getElementById('composeTo').value,
        subject: document.getElementById('composeSubject').value,
        body_plain: document.getElementById('composeBody').value,
    };

    if (!payload.to.trim()) {
        alert('Please enter a recipient email address.');
        return;
    }

    try {
        const btnSend = document.getElementById('btnSubmitSend');
        if (btnSend) {
            btnSend.disabled = true;
            btnSend.textContent = 'Sending...';
        }

        const res = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Send failed');
        }

        const resData = await res.json();
        showToast(`Email dispatched to ${payload.to}!`);
        closeComposeModal();

        // Refresh list
        fetchMessages();
        fetchAccounts();
    } catch (err) {
        alert(`Error sending email: ${err.message}`);
    } finally {
        const btnSend = document.getElementById('btnSubmitSend');
        if (btnSend) {
            btnSend.disabled = false;
            btnSend.textContent = 'Send Email';
        }
    }
}

// Helpers
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function setFolder(folderName) {
    state.currentFolder = folderName;
    deselectMessage();

    // Update active UI classes
    ['inbox', 'sent', 'drafts', 'trash'].forEach(f => {
        const btn = document.getElementById(`folder-${f}`);
        if (btn) {
            if (f === folderName) {
                btn.className = 'w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between folder-active';
            } else {
                btn.className = 'w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-between';
            }
        }
    });

    fetchMessages();
}

// Setup Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Account Selector
    if (el.accountSelect) {
        el.accountSelect.onchange = (e) => {
            state.currentAccount = e.target.value;
            deselectMessage();
            fetchAccounts();
            fetchMessages();
        };
    }

    // Folders
    if (el.folderInbox) el.folderInbox.onclick = () => setFolder('inbox');
    if (el.folderSent) el.folderSent.onclick = () => setFolder('sent');
    if (el.folderDrafts) el.folderDrafts.onclick = () => setFolder('drafts');
    if (el.folderTrash) el.folderTrash.onclick = () => setFolder('trash');

    // Search
    let searchTimeout = null;
    if (el.searchBox) {
        el.searchBox.oninput = (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.searchQuery = e.target.value;
                fetchMessages();
            }, 300);
        };
    }

    // Compose buttons
    if (el.btnOpenCompose) el.btnOpenCompose.onclick = () => openComposeModal();
    if (el.btnCloseCompose) el.btnCloseCompose.onclick = () => closeComposeModal();
    if (el.composeForm) el.composeForm.onsubmit = handleSendMessage;

    // Refresh button
    if (el.btnRefresh) {
        el.btnRefresh.onclick = () => {
            fetchAccounts();
            fetchMessages();
            showToast('Mailbox updated');
        };
    }

    // Initial Load
    fetchAccounts();
    fetchMessages();

    // Auto-polling every 6 seconds for OTPs and new incoming messages
    state.pollingInterval = setInterval(() => {
        fetchAccounts();
        fetchMessages(true);
    }, 6000);
});
