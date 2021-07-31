<?php

namespace App\View\Components;

use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\View\Component;
use Devsrv\Aquastrap\Traits\ExposeMethods;

class Article extends Component
{
    use ExposeMethods;

    // public const SKIP_ROUTES = ['delete'];
    public const SKIP_ROUTES = [];

    /**
     * Create a new component instance.
     *
     * @return void
     */
    public function __construct()
    {
        // $this->middleware('auth');
    }

    public function update(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'profile' => 'nullable|file|mimes:png,jpg',
            'avatar' => 'nullable|file|mimes:png,jpg',
            'tour.*' => 'file|mimes:png,jpg'
        ]);

        // abort(403, 'custom error');
        if ($request->hasFile('profile')) {
            // $request->file('profile')->store('avatars');
            $path = $request->file('profile')->store('profile/10', 'public');
        }

        return response()->json(['success' => 1, 'message' => 'Successfully done'])->setStatusCode(201);
    }

    public function delete()
    {
        // sleep(5);
        return response()->json(['foo' => 'bar']);
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.article');
    }
}
