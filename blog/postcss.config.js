module.exports = {
    plugins: {
        // Objeto vacío intencional para frenar a Next.js de buscar hacia 
        // la raíz del monorepo y accidentalmente tratar de usar 
        // TailwindCSS/PostCSS del proyecto web estático hermano.
    },
};
