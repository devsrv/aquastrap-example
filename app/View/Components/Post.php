<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\ExposeMethods;

class Post extends Component
{
    use ExposeMethods;

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        //
    }

    public function delete()
    {
        return response()->json(['rav' => 'r']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.post');
    }
}
