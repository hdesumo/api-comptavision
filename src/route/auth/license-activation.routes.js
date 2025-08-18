const { createCommissionIfAny } = require('../../lib/affiliates');

// ... à la fin de l’activation réussie :
const baseAmountCents = 0;   // si tu n’as pas encore de prix → 0; sinon mets le montant HT TTC souhaité
const currency = 'XAF';      // ou 'EUR'...
await createCommissionIfAny(license, req, { baseAmountCents, currency });

