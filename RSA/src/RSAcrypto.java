import javax.crypto.Cipher;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class RSAcrypto {

    static {
        java.security.Security.addProvider(
                new org.bouncycastle.jce.provider.BouncyCastleProvider()
        );
    }

    public static RSAPrivateKey getRSAPrivateKeyFromString(String key) throws GeneralSecurityException {
        String privateKeyPEM = key;

        // Remove the first and last lines
        privateKeyPEM = privateKeyPEM.replace("-----BEGIN RSA PRIVATE KEY-----", "");
        privateKeyPEM = privateKeyPEM.replace("-----END RSA PRIVATE KEY-----", "");
        privateKeyPEM = privateKeyPEM.replace("\n", "");

        // Base64 decode data
        byte[] encoded = Base64.getDecoder().decode(privateKeyPEM);

        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateKey privKey = (RSAPrivateKey) kf.generatePrivate(new PKCS8EncodedKeySpec(encoded));
        return privKey;
    }

    public static RSAPublicKey getRSAPublicKeyFromString(String key) throws GeneralSecurityException {
        String publicKeyPEM = key;

        // Remove the first and last lines
        publicKeyPEM = publicKeyPEM.replace("-----BEGIN PUBLIC KEY-----", "");
        publicKeyPEM = publicKeyPEM.replace("-----END PUBLIC KEY-----", "");
        publicKeyPEM = publicKeyPEM.replace("\n", "");


        // Base64 decode data
        byte[] encoded = Base64.getDecoder().decode(publicKeyPEM);

        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPublicKey pubKey = (RSAPublicKey) kf.generatePublic(new X509EncodedKeySpec(encoded));
        return pubKey;
    }

    public static String getStringRSAPrivateKey() {
        return new String ("-----BEGIN RSA PRIVATE KEY-----\n" +
                "MIICXgIBAAKBgQDauAAc1poFnLplzU1Ycnz6IFw5pLuEWTIvWQeXyQuHu2xcF4eo\n" +
                "WONzqc+sHAcGJauov2g0h3k1I+Kpehx3OCV12m7DvJsPhOjVBlhfMiRDesYN9+HQ\n" +
                "1dzg6fbdHbndfJnLfEOSDwBKzvwbNBLid7Hb5yJekparxor9wZfj/vskGwIDAQAB\n" +
                "AoGAXKTz50M/moD4s4Zy7LQSHCD477HHfBgMGeIsRS7zo1rQW3HcFIMSVTvoq45z\n" +
                "qzbpr2DkUtvPi6LXr9H5nMY7lxeEy8CRtkjGue7fDz7eUgwMwTsUOLZVFiel9Uuo\n" +
                "AQsh9fcaFRMgD4EDN86SBtVAWGv2J273iU3rqUsl5kw3ZgECQQD1qswLkG2GE94A\n" +
                "8JddeQ4q7wQ2XcPcIbyjXBGqDzJK3OU9Q2dADvypFMmXDDKLjhNl6StGzAi4Ftg3\n" +
                "w+GYQFVrAkEA4+sJynGPTq8qwntsEs9Zg35iqBY8+si/rTAk2j03fF7mT2DZF1eu\n" +
                "V07RYCUIYrRBrYBvmNKHREOJOD1+noZoEQJBAKACdRB7K7sOqaS3D//j3yR7taSr\n" +
                "geyZVMKaLy8y4rD8G5vBkTiaClsenQby/OEE0wGn03YzYuJ0jrQTs5Z1IK0CQQCX\n" +
                "1wUdzsvnYsF88ZbNbUA4XyHA05fqh4VTDwjuL+xgOiT7aw0WBP8MAWFxyRouD+LV\n" +
                "gQRX7qHZM5keU7GgUPDRAkEAlzhNVTIT0Z8s7cJmS5aiSaVoWqS6q+gHATyV2Qwj\n" +
                "zT/z2apXn6C2ZRz7Fo1iPoJG7QDjyKnSNqXRVAPvcRxFXw==\n" +
                "-----END RSA PRIVATE KEY-----");
    }

    public static String getStringRSAPublicKey() {
        return new String ("-----BEGIN PUBLIC KEY-----\n"+
                "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDauAAc1poFnLplzU1Ycnz6IFw5\n"+
                "pLuEWTIvWQeXyQuHu2xcF4eoWONzqc+sHAcGJauov2g0h3k1I+Kpehx3OCV12m7D\n"+
                "vJsPhOjVBlhfMiRDesYN9+HQ1dzg6fbdHbndfJnLfEOSDwBKzvwbNBLid7Hb5yJe\n"+
                "kparxor9wZfj/vskGwIDAQAB\n"+
                "-----END PUBLIC KEY-----");
    }

    public static String encrypt(String rawText, PublicKey publicKey) throws IOException, GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.ENCRYPT_MODE, publicKey);
        return Base64.getEncoder().encodeToString(cipher.doFinal(rawText.getBytes("UTF-8")));
    }

    public static String decrypt(String cipherText, PrivateKey privateKey) throws IOException, GeneralSecurityException {
        Cipher cipher = Cipher.getInstance("RSA");
        cipher.init(Cipher.DECRYPT_MODE, privateKey);
        return new String(cipher.doFinal(Base64.getDecoder().decode(cipherText)), "UTF-8");
    }


    public static void main(String... args) {
        RSAPrivateKey privateKey;
        PublicKey publicKey;
        try {
             privateKey = getRSAPrivateKeyFromString(getStringRSAPrivateKey());
             String php = "Bstf30/V9u0FlYMMPuhQpY6TG5sHNEyymCy8XrKm/iguOq34YiIJrlrtcd78ukne5wfUGOOpoBmeKKy5CkBRmmN3hzlOTp3pW1S+uWQoHZeDcUwGuSOVVG0uVU/SCvCqhUK5SKBTDBnUMoq33f9Svl8VXd/013ryg9raVhJplNI=";
             String js = "H6IwPUkaphnnVba1xw4GKN4Eh69EThePfXefVvBMAfJM1Oyubdrm56KZ0g/ZwEM/fmVDz3e3cCwfTK2iiMRIJNSyeeY4VBbolqhynPJjNMQ/adnd0B378xkbp7/LDa7Mhh1DJCoDXFtUK25UAOKOXMEnAMoc9KcfsD8d4WW3I5U=";
             String decryptedText = decrypt(php,
                     privateKey);
             System.out.println("decrypted:" + decryptedText);
             publicKey = getRSAPublicKeyFromString(getStringRSAPublicKey());
             String encryptedJavaText = encrypt("test java message", publicKey);
             System.out.println("encrypted java:" + encryptedJavaText);
             String decryptedJavaText = decrypt(encryptedJavaText,privateKey);
             System.out.println(decryptedJavaText);
        } catch (IOException | GeneralSecurityException e) {
            e.printStackTrace();
        }

    }
}
