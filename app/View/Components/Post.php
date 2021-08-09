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
        return $this->success('success message', ['hello' => 'world']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.post', ['foo' => 'bar'])->with($this->aquaRecipes());
    }
}
