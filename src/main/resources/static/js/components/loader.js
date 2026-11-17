class AppLoader extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const message = this.getAttribute('message') || 'Chargement...';
        
        this.innerHTML = `
            <div class="flex-center flex-col gap-2 p-8 text-center text-muted w-full">
                <span class="material-symbols-outlined animate-spin text-purple text-3xl">autorenew</span>
                <span class="text-sm font-medium">${message}</span>
            </div>
        `;
    }
}

customElements.define('app-loader', AppLoader);
