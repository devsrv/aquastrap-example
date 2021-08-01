<?php

namespace App\View\Components;

use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\AquaSync;

class Post extends Component
{
    use AquaSync;

    // protected static $middlewares = ['auth'];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct(public $username, public $comment = '', public $foo = null)
    {

    }

    public function delete()
    {
        return response()->json(['success' => 1]);
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
