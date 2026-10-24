<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('paragraphs', function (Blueprint $table) {
            $table->id();
            $table->string('title')->nullable();
            $table->text('content');
            $table->string('difficulty_level')->index();
            $table->unsignedBigInteger('created_by_admin_id')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('paragraphs');
    }
};
