<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Globally Applied Middlewares
    |--------------------------------------------------------------------------
    |
    | Here you may specify the list of middlewares to be applied globally
    | for each Aquastrap request.
    |
    | Note: Web middleware group is by default applied.
    |
    */

    'middleware' => [],

    /*
    |--------------------------------------------------------------------------
    | Default Encryption Strategy
    |--------------------------------------------------------------------------
    |
    | Each Aquastrap request carries the information about the requested class and
    | it's dependendencies giving you convenient access to any public method of that
    | class.
    | To keep these data secure Aquastrap send these information as encrypted string
    | and passes via request header for each network request.
    | By default Laravel's natve Crypt Facade is used, to customize this behavioir
    | you can supply your own encrypter & Decrypter.
    |
    | Note: the methods should be statically callable on the class.
    |
    */

    'encryption' => [

        'default' => env('AQUASTRAP_ENCRYPTION', 'halite'),

        'strategy' => [
            'native' => [
                'encrypter' => [\Illuminate\Support\Facades\Crypt::class, 'encryptString'],
                'decrypter' => [\Illuminate\Support\Facades\Crypt::class, 'decryptString']
            ],
            'custom' => [
                'encrypter' => [\App\Services\Crypt\Crypter::class, 'Encrypt'],
                'decrypter' => [\App\Services\Crypt\Crypter::class, 'Decrypt']
            ],
            'halite' => [
                'key_path' => storage_path('app/aquastrap/encryption.key'),
                'encrypter' => [\Devsrv\Aquastrap\Crypt\Halite\Crypt::class, 'Encrypt'],
                'decrypter' => [\Devsrv\Aquastrap\Crypt\Halite\Crypt::class, 'Decrypt']
            ]
        ]
    ]
];
