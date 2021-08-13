<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\AquaSync;
use Devsrv\Aquastrap\AquaComponent;
use Illuminate\Http\Request;

class VueForm extends AquaComponent
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

    public function store(Request $request)
    {
        sleep(1);

        $request->validate([
            'comment' => 'required|min:10'
        ]);

        return $this->success('success message', ['foo' => 'world']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.vue-form');
    }
}
