# Téléchargements Tomonana

Ce dépôt de distribution est destiné uniquement à la page publique, au logo et aux métadonnées des versions Android. Les APK sont joints aux GitHub Releases ; ils ne sont pas stockés dans Git.

Adresse prévue : https://kembo-dev.github.io/tomonana-downloads/
Lien permanent prévu : https://github.com/kembo-dev/tomonana-downloads/releases/latest/download/tomonana.apk

La page est autonome : aucun appel à l’API Tomonana, aucun secret et aucune donnée utilisateur. Elle ne répare pas l’adresse codée dans un ancien APK déjà distribué ; les utilisateurs de ces APK reçoivent d’abord le lien manuellement.

À chaque version : vérifier la signature et le SHA256 de l’APK, préparer une release en brouillon, joindre `tomonana.apk`, `tomonana.apk.sha256` et `manifest.json`, comparer le digest GitHub, puis publier la release et actualiser les métadonnées de la page. Ne jamais modifier un asset de version publié pour lui substituer un autre binaire.
