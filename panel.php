<html>
<head>
<title>Admin Interface for adding questions</title>
</head>
<body>
<form method="post" enctype="multipart/form-data" action="/upload">
	<br>Game Name
	<input name='game_name' type='text'>

	<br><br>Base image 1
    <input type="file" name="b_1">
    <br><br>Answer images 1 (Multi Select)
    <input type="file" name="a_1[]" multiple>

    <br><br>Base image 2
    <input type="file" name="b_2">
    <br><br>Answer images 2 (Multi Select)
    <input type="file" name="a_2[]" multiple>

	<br><br>Base image 3
    <input type="file" name="b_3">
    <br><br>Answer images 3 (Multi Select)
    <input type="file" name="a_3[]" multiple>

	<br><br>Base image 4
    <input type="file" name="b_4">
    <br><br>Answer images 4 (Multi Select)
    <input type="file" name="a_4[]" multiple>

	<br><br>Base image 5
    <input type="file" name="b_5">
    <br><br>Answer image (Multi Select)
    <input type="file" name="a_5[]" multiple>

    <br><br>
    <input type="submit" value="Submit">
</form>


<script src='/static/js/jquery.js'></script>
</body>
</html>