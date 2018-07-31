<?php
$key_private = openssl_get_privatekey(file_get_contents('rsa_1024_priv.pem'));
$key_public = openssl_get_publickey(file_get_contents('rsa_1024_pub.pem'));
$decrypted = "";
openssl_public_encrypt("This is a test!", $decrypted, $key_public);
echo "decrypt:".base64_encode($decrypted)."\n";
?>
