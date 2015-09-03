<!-- This file is hosted in /www for proceesing the form  -->
<?php

function makedirs($dirpath, $mode=0777) {
    return is_dir($dirpath) || mkdir($dirpath, $mode, true);
 } 


$output_dir = "/home/rohit/Desktop/Rohit/Squadrun/SquadRun-Challenge/static/images/";
$connection = pg_connect("host=localhost dbname=ESP user=postgres password=rohit");

if (!$connection) {
    print("Connection Failed.");
    exit;
}
$name = $_POST['game_name'];
$rounds = $_POST['game_rounds'];
$game_points = $_POST['game_points'];
$round_levels = $_POST['round_levels'];
$win_points = $_POST['win_points'];
$loose_points = $_POST['loose_points'];



makedirs($output_dir.$name);
for($i=0;$i<intval($rounds);$i++)
	makedirs($output_dir.$name.'/round_'.($i+1));

$sql ='INSERT INTO "game" ("Name","rounds","round_levels","game_points","round_level_win_points","round_level_loose_points")'. " VALUES ('$name', '$rounds','$round_levels','$game_points','$win_points','$loose_points')";

$myresult = pg_query($connection, $sql);

$round_levels = explode(',',$round_levels); 

// var_dump($_POST);
// var_dump($_FILES);

if($_POST['req_type'] == 'nd'){
for($i=0;$i<$rounds;$i++){
	$base_dir = $output_dir.$name.'/round_'.($i+1).'/';

	for($j=0;$j<$round_levels[$i];$j++){
		$extension_b = explode('.',($_FILES['b_'.($i+1).'_'.($j+1)]['name']))[1];
		$base_image = ($j+1).'_0.'.$extension_b;
		echo '<br>base_image->'.$base_image;
		move_uploaded_file($_FILES['b_'.($i+1).'_'.($j+1)]["tmp_name"],$base_dir.$base_image);
		echo '<br>Answer Images->';
		for($k=0;$k<count($_FILES['a_'.($i+1).'_'.($j+1)]["name"]);$k++){
			$extension_i = explode('.',($_FILES['a_'.($i+1).'_'.($j+1)]['name'][$k]))[1];
			$answer_image = ($j+1).'_'.($k+1).'.'.$extension_i;
			echo '<br>path->'.$answer_image;
			move_uploaded_file($_FILES['a_'.($i+1).'_'.($j+1)]['tmp_name'][$k], $base_dir.$answer_image);
		}
	}
}
echo '<br><br>Done!';
}
else if($_POST['req_type']=='d'){
	$r=0;
	for($i=0;$i<count($_FILES['dyn_img']['name']);){
			$base_dir = $output_dir.$name.'/round_'.($r+1).'/';
			for($j=0;$j<$round_levels[$r];$j++){
					$extension_b = explode('.',$_FILES['dyn_img']['name'][$i])[1];
					$base_image = ($j+1).'_0.'.$extension_b;
					$base_image = $base_dir.$base_image;
					move_uploaded_file($_FILES['dyn_img']['tmp_name'][$i],$base_image);
					echo '<br>'.$base_image;
					for($k=1;$k<=4;$k++){
						$extension_i = explode('.',$_FILES['dyn_img']['name'][$i+$k])[1];
						$answer_image = ($j+1).'_'.$k.'.'.$extension_i;
						$answer_image = $base_dir.$answer_image;
						move_uploaded_file($_FILES['dyn_img']['tmp_name'][$i+$k],$answer_image);
						echo '<br>'.$answer_image;
					}
					$i+=5;
			}
			$r+=1;
	}
	echo '<br><br>Done!';
}
else{
	echo 'Invalid Request';
	die();
}
?>
