<?php
    $host_name = 'db688392492.db.1and1.com';
    $database = 'db688392492';
    $user_name = 'dbo688392492';
    $password = 'kx$5wjmbP&';
    $connect = mysqli_connect($host_name, $user_name, $password, $database);

    if (mysqli_connect_errno()) {
        die('{"error": "Failed to connect to MySQL: '.mysqli_connect_error().'"}');
    }

    $type = $_REQUEST['type'];
    $fields = $_REQUEST['fields'];
    $values = $_REQUEST['values'];
    $table = $_REQUEST['table'];
    $conditions = $_REQUEST['conditions'];
    $sorts = $_REQUEST['sorts'];

    $debug = implode(',', array_keys($values)) . ' => ' . implode(',', $values);

    $whereClause = '';
    if (count($conditions) > 0) {
        $whereClause = ' WHERE ';
        $firstcondition = true;
        foreach($conditions as $key => $value) {
            if ($firstcondition) {
                $firstcondition = false;
            } else {
                $whereClause .= ' AND ';
            }
            $whereClause .= $key . '=' . $value;
        }
    }

    $orderByClause = '';
    if (count($sorts) > 0) {
        $orderByClause = ' ORDER BY ';
        $firstsort = true;
        foreach($sorts as $key => $value) {
            if ($firstsort) {
                $firstsort = false;
            } else {
                $orderByClause .= ', ';
            }
            $orderByClause .= $key;
            $debug .= 'order clause '.$key.'=>'.$value.' | ';
            if (!$value || $value == 'false') {
                $orderByClause .= ' DESC';
            } else {
                $orderByClause .= ' ASC';
            }
        }
    }

    $query = '';

    switch($_SERVER['REQUEST_METHOD'])
    {
        case 'GET': // SELECT
            $query = 'SELECT ' . implode(',', $fields) . ' FROM ' . $table;
            if ($whereClause != '') {
                $query .= $whereClause;
            }
            if ($orderByClause != '') {
                $query .= $orderByClause;
            }
            break;
        case 'POST':
            switch($type) {
                case 2: // INSERT
                    $query = 'INSERT INTO ' . $table . ' (' . implode(',', array_keys($values)) . ') VALUES (' . implode(',', $values) . ')';
                    break;
                case 3: // UPDATE                
                    $query = 'UPDATE ' . $table . ' SET ';
                    $firstflag = true;
                    foreach($values as $key => $value) {
                        if ($firstflag) {
                            $firstflag = false;
                        } else {
                            $query .= ', ';
                        }
                        $query .= $key . '=' . $value;
                    }
                    if ($whereClause != '') {
                        $query .= $whereClause;
                    }
                    break;
                case 4: // DELETE
                    $query = 'DELETE FROM ' . $table;
                    if ($whereClause != '') {
                        $query .= $whereClause;
                    }
                    break;
            }
            break;
    }

    $result = mysqli_query($connect, $query);

     if (mysqli_errno($connect)) {
         die('{"error": "SQL Error: ' . mysqli_error($connect) . '", "query": "' . $query . '", "debug": "' . $debug . '"}');
     }

    $rows = mysqli_fetch_all($result);
    $rfields = mysqli_fetch_fields($result);

    mysqli_free_result($result);    
    mysqli_close($connect);

    echo '{"query": "' . $query . '", "debug": "' . $debug . '", "results": [';
    $firstrow = true;
    foreach($rows as $row) {

        if ($firstrow) {
            $firstrow = false; 
        } else {
            echo ', ';
        }

        echo '{';
        $firstfield = true;
        foreach($row as $key => $value) {
            if ($firstfield) {
                $firstfield = false; 
            } else {
                echo ', ';
            }
            echo '"' . $rfields[$key]->name . '": "' . $value . '"';
        }

        echo '}';
    }

    echo ']}';
?>