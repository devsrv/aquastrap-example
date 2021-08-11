<?php

namespace App\Services\Crypt;
use Devsrv\Aquastrap\Contracts\Crypto;

class Crypter implements Crypto
{
    public const encrypt_method = "AES-256-CBC";
    public const secret_key = 'AA74CDCC2BBRT935136HH7B63C27'; // user define private key
    public const secret_iv = '1080e32ca02e14647b01'; // user define secret key - bin2hex(random_bytes(10))

    protected static $key;
    protected static $iv;

    protected static function init()
    {
        self::$key = hash('sha256', self::secret_key);
        self::$iv = substr(hash('sha256', self::secret_iv), 0, 16); // sha256 is hash_hmac_algo
    }

    public static function Encrypt($content) : string
    {
        self::init();

        $encrypted = openssl_encrypt($content, self::encrypt_method, self::$key, 0, self::$iv);
        $output = base64_encode($encrypted);

        return $output;
    }

    public static function Decrypt($content) : string
    {
        self::init();

        $decrypted = openssl_decrypt(base64_decode($content), self::encrypt_method, self::$key, 0, self::$iv);

        return $decrypted;
    }
}
