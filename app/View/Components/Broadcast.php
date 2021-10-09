<?php

namespace App\View\Components;

use Aqua\Aquastrap\AquaComponent;
use Aqua\Aquastrap\Traits\AquaSync;

class Broadcast extends AquaComponent
{
    use AquaSync;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(public $id)
    {
        //
    }

    public function store()
    {
        sleep(2);

        return $this->success('success message')
        ->setContent(['message' => 'done successfully']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.broadcast');
    }
}
