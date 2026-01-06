const btnProjectNameSave = document.getElementById('btnProjectNameSave');
const btnProjectDelete = document.getElementById('btnProjectDelete');
const old_name = document.getElementById("OldProjectName").value;

btnProjectNameSave.addEventListener('click', function() {

    const new_name = document.getElementById('ProjectName').value;

    if(new_name !== old_name) alert(`Change project name from ${old_name} to ${new_name}`);
    else alert("project name didn't change.")
       
    let data = {
        type: 'ProjectName',
        ProjectName : document.getElementById('ProjectName').value
    };
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json'
    });
});

btnProjectDelete.addEventListener('click', function() {
    if (!confirm('Are you sure you want to delete this project?')) {
        return;
    }
    let data = {
        type: 'ProjectDelete',
        PID: PID
    };
    $.ajax({
        URL: window.location.href,
        data: JSON.stringify(data),
        type: 'POST',
        dataType: 'json',
        contentType:'application/json',
        success: function(response) {
            window.location.href = '/projects';
        }
    });
})