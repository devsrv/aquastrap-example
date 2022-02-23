<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Aqua\Aquastrap\AquaComponent;
use Aqua\Aquastrap\Traits\AquaSync;

class Game extends AquaComponent
{
    use AquaSync;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    public function store()
    {
        $this->rateLimit(2);

        $this->clearRateLimiter();

        return $this->success('success message')
        ->setStatusCode(204);
    }

    public function download()
    {
        return response()->streamDownload(function () {
            echo file_get_contents('https://file-examples-com.github.io/uploads/2017/02/file-sample_500kB.doc');
        }, '500kB.doc', [
            'Content-Type' => "application/msword; charset=utf-8",
        ]);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.game');
    }
}
