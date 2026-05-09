export const ADD_PRODUCT_STYLES = `
    .glass-card {
        background: #1e2532;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .card-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .card-header h3 { font-size: 1rem; font-weight: 700; color: white; }
    .field-label { display: block; font-size: 0.8rem; font-weight: 500; color: rgb(148 163 184); margin-bottom: 0.5rem; }
    .input-field { width: 100%; padding: 0.6rem 0.8rem; border-radius: 0.5rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.08); color: white; font-size: 0.875rem; transition: all 0.2s; }
    .input-field:focus { outline: none; border-color: rgba(16, 185, 129, 0.5); box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1); background: rgba(0,0,0,0.3); }
    .btn-secondary { padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; }
    .btn-secondary:hover { background: rgba(255,255,255,0.1); }
    .btn-primary { padding: 0.5rem 1rem; background: rgba(16, 185, 129, 0.1); color: rgb(52, 211, 153); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 0.5rem; font-weight: 600; transition: all 0.2s; }
    .btn-primary:hover { background: rgba(16, 185, 129, 0.2); }
    .btn-ghost { padding: 0.4rem 0.75rem; background: transparent; color: rgb(148 163 184); border: 1px solid rgba(255,255,255,0.08); border-radius: 0.5rem; font-weight: 500; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.25rem; }
    .btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
    .flip-x { transform: scaleX(-1); }
`;
