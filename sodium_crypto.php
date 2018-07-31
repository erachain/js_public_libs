<?php
function base58_encode($input) {
    $alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    $base_count = strval(strlen($alphabet));
    $encoded = '';
    while (floatval($input) >= floatval($base_count)) {
        $div = bcdiv($input, $base_count);
        $mod = bcmod($input, $base_count);
        $encoded = substr($alphabet, intval($mod), 1) . $encoded;
        $input = $div;
    }
    if (floatval($input) > 0) {
        $encoded = substr($alphabet, intval($input), 1) . $encoded;
    }
    return($encoded);
}

function base58_decode($input) {
    $alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
    $base_count = strval(strlen($alphabet));
    $decoded = strval(0);
    $multi = strval(1);
    while (strlen($input) > 0) {
        $digit = substr($input, strlen($input) - 1);
        $decoded = bcadd($decoded, bcmul($multi, strval(strpos($alphabet, $digit))));
        $multi = bcmul($multi, $base_count);
        $input = substr($input, 0, strlen($input) - 1);
    }
    return($decoded);
}

function key_to_base58($input) {
    return base58_encode(base58_decode(base64_encode($input)));
}

//$keypair = sodium_crypto_sign_keypair();
$seed = str_repeat('x', SODIUM_CRYPTO_SIGN_SEEDBYTES);
$keypair = sodium_crypto_sign_seed_keypair($seed);
$seed2 = str_repeat('z', SODIUM_CRYPTO_SIGN_SEEDBYTES);
$keypair2 = sodium_crypto_sign_seed_keypair($seed2);
echo "keypair_base64:".base64_encode($keypair)."\n";
echo "keypair_base58:".key_to_base58($keypair)."\n";
$publickey = sodium_crypto_sign_publickey($keypair);
$publickey2 = sodium_crypto_sign_publickey($keypair2);
echo "public:".key_to_base58($publickey)."\n";
echo "public2:".key_to_base58($publickey2)."\n";
$secretkey = sodium_crypto_sign_secretkey($keypair);
$secretkey2 = sodium_crypto_sign_secretkey($keypair2);
echo "secret:".key_to_base58($secretkey)."\n";
echo "secret2:".key_to_base58($secretkey2)."\n";

$msg = "test message";
$signature = sodium_crypto_sign_detached($msg, $secretkey);
echo "signature:".key_to_base58($signature)."\n";
echo "verify:".sodium_crypto_sign_verify_detached($signature, $msg, $publickey)."\n";

$curve_secretkey = sodium_crypto_sign_ed25519_sk_to_curve25519($secretkey);
$curve_publickey = sodium_crypto_sign_ed25519_pk_to_curve25519($publickey);
$curve_secretkey2 = sodium_crypto_sign_ed25519_sk_to_curve25519($secretkey2);
$curve_publickey2 = sodium_crypto_sign_ed25519_pk_to_curve25519($publickey2);
echo "curve_public:".key_to_base58($curve_publickey)."\n";
echo "curve_secret:".key_to_base58($curve_secretkey)."\n";
$shared_secret = sodium_crypto_scalarmult($curve_secretkey, $curve_publickey2);
$shared_secret2 = sodium_crypto_scalarmult($curve_secretkey2, $curve_publickey);


echo "shared secret ECDH:".key_to_base58($shared_secret)."\n";
echo "shared secret ECDH2:".key_to_base58($shared_secret2)."\n";

//test
$test_publickey = base58_decode("492NHvVPQz1DoqqERX7aZ4YkyS5VUpWeaXsUGsAoNBpS");
$test_secretkey = base58_decode("3AvqMNJgbUtUWzMaLXQG1LGSTeRJwGmYcNh5Jrmc3xBjwUos6L2yAXrZ3tS8QNQM2qBnhZozonxktru8n3gfyZqG");
$test_publickey2 = base58_decode("2aYRv1TkszZ5kWekzo554FKsdi2jNSoFUu1NYQyAM8C9");
$test_secretkey2 = base58_decode("2mTwwdskkjghYhUHxfTqJZtwesCtcsVjH5W3DRMnMd67ED13xu9NawNri67k9949AH5krjDuoCor5xGBBKQ4RTyz");
$test_curve_secretkey = sodium_crypto_sign_ed25519_sk_to_curve25519($test_secretkey);
$test_curve_publickey = sodium_crypto_sign_ed25519_pk_to_curve25519($test_publickey);
$test_curve_secretkey2 = sodium_crypto_sign_ed25519_sk_to_curve25519($test_secretkey2);
$test_curve_publickey2 = sodium_crypto_sign_ed25519_pk_to_curve25519($test_publickey2);
echo "test_curve_public:".key_to_base58($test_curve_publickey)."\n";
echo "test_curve_secret:".key_to_base58($test_curve_secretkey)."\n";
$test_shared_secret = sodium_crypto_scalarmult($test_curve_secretkey, $test_curve_publickey2);
$test_shared_secret2 = sodium_crypto_scalarmult($test_curve_secretkey2, $test_curve_publickey);


echo "test shared secret ECDH:".key_to_base58($test_shared_secret)."\n";
echo "test shared secret ECDH2:".key_to_base58($test_shared_secret2)."\n";

?>